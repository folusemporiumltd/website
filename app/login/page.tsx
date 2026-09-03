import { login, signup } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; message?: string }> }) {
  const params = await searchParams
  return (
    <main>
      <h1>Welcome to Folus Emporium</h1>
      <p>Sign in to access your account.</p>
      {params.error && <p role="alert">{params.error}</p>}
      {params.message && <p>{params.message}</p>}
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" minLength={6} required />
        <input type="hidden" name="next" value={params.next ?? '/account'} />
        <button formAction={login}>Sign in</button>
        <button formAction={signup}>Create account</button>
      </form>
    </main>
  )
}
