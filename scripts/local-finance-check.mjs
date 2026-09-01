#!/usr/bin/env node

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
]

const missing = required.filter((name) => !process.env[name])
if (missing.length) {
  console.error(`Missing local environment variables: ${missing.join(', ')}`)
  process.exit(1)
}

const forbidden = Object.keys(process.env).filter((name) =>
  /SERVICE_ROLE|PRIVATE_KEY|MINIPAY_SECRET|WEBHOOK_SECRET/i.test(name),
)
if (forbidden.length) {
  console.error(`Refusing to run with server secrets in the local public test environment: ${forbidden.join(', ')}`)
  process.exit(1)
}

console.log('NEXORA local finance preflight passed.')
console.log('Only public Supabase client configuration is present.')
console.log('Real payouts must be exercised through the server-side withdrawal path, never from client code.')
