import Link from 'next/link'
import { login, manualLogin } from './actions'

export default async function LoginPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) ?? {}
  const error = typeof params.error === 'string' ? params.error : ''
  const message = error === 'invalid_credentials' ? 'Email or password is incorrect.' : error === 'invalid_manual_credentials' ? 'User ID or password is incorrect.' : ''

  return <main className="login-shell"><section className="glass login-card">
    <div className="brand" style={{padding:'0 0 22px'}}><span className="brand-mark"/>NEXORA</div>
    <div className="eyebrow">Secure access</div>
    <h1 style={{fontSize:32,marginBottom:8}}>Welcome back.</h1>
    <p className="muted" style={{lineHeight:1.6}}>Choose the credential type your NEXORA account uses. Email accounts and administrator-issued User IDs are separate login paths.</p>
    {message && <div className="error" style={{marginTop:14}}>{message}</div>}

    <section style={{marginTop:20}}>
      <div className="section-head"><div><h3 style={{margin:0}}>Email account</h3><div className="muted" style={{fontSize:12}}>For standard NEXORA accounts.</div></div></div>
      <form action={login} style={{display:'grid',gap:10,marginTop:12}}>
        <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" /></div>
        <div className="field"><label htmlFor="email-password">Password</label><input id="email-password" name="password" type="password" required minLength={8} autoComplete="current-password" /></div>
        <button className="btn" type="submit">Log in with email</button>
      </form>
    </section>

    <section style={{marginTop:20}}>
      <div className="section-head"><div><h3 style={{margin:0}}>Managed User ID</h3><div className="muted" style={{fontSize:12}}>Provisioned manually by NEXORA administrators.</div></div></div>
      <form action={manualLogin} style={{display:'grid',gap:10,marginTop:12}}>
        <div className="field"><label htmlFor="user-id">User ID</label><input id="user-id" name="userId" type="text" required minLength={4} maxLength={32} autoComplete="username" placeholder="e.g. operator_4821" /></div>
        <div className="field"><label htmlFor="user-password">Password</label><input id="user-password" name="password" type="password" required minLength={8} autoComplete="current-password" /></div>
        <button className="btn secondary" type="submit">Log in with User ID</button>
      </form>
    </section>

    <div className="notice" style={{marginTop:18}}>Managed User IDs are issued by an administrator. Public signup cannot create them.</div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginTop:18}}>
      <span className="footer-note" style={{margin:0}}>Need a normal account?</span>
      <Link className="btn secondary" href="/signup">Create an account</Link>
    </div>
    <p className="footer-note">Sessions use secure HTTP-only cookies. Credentials are never stored in localStorage.</p>
  </section></main>
}
