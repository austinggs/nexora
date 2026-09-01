const publicNames = [
  'NEXT_PUBLIC_CELO_PAYOUT_PRIVATE_KEY',
  'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_SECRET_KEY',
]

const leaked = publicNames.filter((name) => process.env[name])
if (leaked.length) {
  console.error(`Unsafe public finance variables detected: ${leaked.join(', ')}`)
  process.exit(1)
}

const required = ['CELO_RPC_URL', 'CELO_PAYOUT_PRIVATE_KEY', 'CELO_USDC_ADDRESS', 'CELO_USDT_ADDRESS', 'CELO_USDM_ADDRESS']
const missing = required.filter((name) => !process.env[name])
if (missing.length) {
  console.log(`Celo payout preflight: configuration incomplete (${missing.join(', ')}). No transaction will be signed or broadcast.`)
  process.exit(2)
}

for (const name of ['CELO_USDC_ADDRESS', 'CELO_USDT_ADDRESS', 'CELO_USDM_ADDRESS']) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(process.env[name])) {
    console.error(`Invalid Celo contract address: ${name}`)
    process.exit(1)
  }
}

if (!/^0x[0-9a-fA-F]{64}$/.test(process.env.CELO_PAYOUT_PRIVATE_KEY.replace(/^0x/, '0x'))) {
  console.error('CELO_PAYOUT_PRIVATE_KEY must be a 32-byte hex private key.')
  process.exit(1)
}

console.log('Celo payout preflight: configuration shape is valid. This check does not broadcast a transaction.')
