import { login, signup } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; message?: string }> }) {
  const params = await searchParams
  const isCheckout = params.next === '/checkout'

  return (
    <main>
      <section className="section">
        <div className="container" style={{ maxWidth: 680 }}>
          <div className="eyebrow">{isCheckout ? 'Checkout registration' : 'Customer account'}</div>
          <h1>Welcome to Folus Emporium</h1>
          <p>{isCheckout ? 'Create your account to continue from your cart to secure Paystack payment.' : 'Sign in to access your account, or create a new account.'}</p>
          {params.error && <p role="alert">{params.error}</p>}
          {params.message && <p>{params.message}</p>}

          <form>
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" type="text" autoComplete="name" placeholder="Your full name" required />

            <label htmlFor="phone">Phone number</label>
            <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="0800 000 0000" required />

            <label htmlFor="address">Delivery address</label>
            <textarea id="address" name="address" autoComplete="street-address" placeholder="House number, street, area" rows={4} required />

            <label htmlFor="city">City</label>
            <input id="city" name="city" type="text" autoComplete="address-level2" placeholder="Your city" required />

            <label htmlFor="state">State</label>
            <input id="state" name="state" type="text" autoComplete="address-level1" placeholder="Your state" required />

            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />

            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required />

            <input type="hidden" name="next" value={params.next ?? '/account'} />
            <button formAction={login}>Sign in</button>
            <button formAction={signup}>Create account</button>
          </form>
        </div>
      </section>
    </main>
  )
}
