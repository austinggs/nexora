import Link from 'next/link'
import { signup } from '../login/actions'

export default async function SignupPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) ?? {}
  const error = typeof params.error === 'string' ? params.error : ''
  const success = typeof params.success === 'string' ? params.success : ''
  return <main className="login-shell"><section className="glass login-card">
    <div className="brand" style={{padding:'0 0 22px'}}><span className="brand-mark"/>NEXORA</div>
    <div className="eyebrow">Create account</div>
    <h1 style={{fontSize:32,marginBottom:8}}>Join NEXORA.</h1>
    <p className="muted" style={{lineHeight:1.6}}>Create a standard NEXORA account with email and password. Managed User IDs are created separately by administrators.</p>
    {error && <div className="error" style={{marginTop:14}}>We couldn't create that account. Check your details and try again.</div>}
    {success && <div className="notice" style={{marginTop:14}}>Check your email to complete account confirmation.</div>}
    <form action={signup} style={{display:'grid',gap:10,marginTop:18}}>
      <div className="field"><label htmlFor="signup-email">Email</label><input id="signup-email" name="email" type="email" required autoComplete="email" /></div>
      <div className="field"><label htmlFor="signup-password">Password</label><input id="signup-password" name="password" type="password" required minLength={8} autoComplete="new-password" /></div>
      <button className="btn" type="submit">Create account</button>
    </form>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginTop:18}}>
      <span className="footer-note" style={{margin:0}}>Already have an account?</span>
      <Link className="btn secondary" href="/login">Back to login</Link>
    </div>
  </section></main>
}
