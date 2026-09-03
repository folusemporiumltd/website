import Link from 'next/link'

export default function Home() {
  return (
    <main>
      <h1>Folus Emporium</h1>
      <p>Curating Excellence for Life’s Finest Moments</p>
      <nav>
        <Link href="/account">My Account</Link>
      </nav>
    </main>
  )
}
