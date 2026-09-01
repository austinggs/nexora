import 'server-only'

import type { Address } from 'viem'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCeloTokenTransfer } from '@/lib/celo/server'

function isAddress(value: string): value is Address {
  return /^0x[0-9a-fA-F]{40}$/.test(value)
}

export async function processCeloWithdrawal(withdrawalId: string) {
  const supabase = createAdminClient()
  const { data: withdrawal, error: claimError } = await supabase.rpc('claim_withdrawal_for_payout', {
    p_withdrawal_id: withdrawalId,
  })
  if (claimError) throw new Error(`Unable to claim withdrawal: ${claimError.message}`)
  if (!withdrawal) throw new Error('Withdrawal was not returned after claim')

  if (!isAddress(withdrawal.wallet_address)) throw new Error('Invalid withdrawal wallet address')

  // IMPORTANT: the database is now in processing state and the debit is reserved.
  // If broadcasting fails, callers must reconcile the processing withdrawal before retrying.
  // We intentionally do not automatically mark it failed after an ambiguous network error:
  // a transaction may have reached the chain even when the RPC response was lost.
  const hash = await sendCeloTokenTransfer(
    withdrawal.token,
    withdrawal.wallet_address as Address,
    BigInt(withdrawal.amount),
  )

  const { data: finalized, error: finalizeError } = await supabase.rpc('finalize_celo_withdrawal', {
    p_withdrawal_id: withdrawal.id,
    p_tx_hash: hash,
  })
  if (finalizeError) {
    throw new Error(`Celo transfer broadcast as ${hash}, but database finalization failed: ${finalizeError.message}`)
  }

  return finalized
}
