import Link from 'next/link'

const questions = [
  ['How do I place an order?', 'Browse the Shop, choose your preferred pack size and quantity, add it to your cart, then proceed to your cart and checkout.'],
  ['Do I need an account to order?', 'You can browse products and add items to your cart without an account. You will need to create an account or sign in before proceeding to checkout and payment.'],
  ['Where do you deliver?', 'We serve homes and businesses across Nigeria. Delivery charges are shown at checkout based on your delivery location.'],
  ['How can I track my order?', 'Sign in to My Account and open Order History & Tracking to view the latest status of your order. You can also contact us with your order reference for support.'],
  ['How should I store my products?', 'Keep packaged products sealed in a cool, dry place away from direct sunlight. Follow any specific storage advice printed on the pack.'],
  ['What if an item is missing, damaged or incorrect?', 'Please contact us as soon as possible, with your order reference and clear photographs where relevant. We will review and help resolve the issue.'],
]

export default function FAQPage() {
  return <main className="support-page" id="faq"><section className="section"><div className="container"><div className="eyebrow">Customer Service</div><h1>Frequently asked questions</h1><p>Helpful answers for ordering from Folus Emporium. Need more help? <Link href="/contact">Contact us</Link>.</p><div className="faq-list">{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></div></section></main>
}
