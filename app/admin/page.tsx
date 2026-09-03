import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')
  const { data: profile } = await supabase.from('profiles').select('full_name,role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/account')

  const [{ count: products }, { count: orders }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
  ])

  return <main><h1>Admin Dashboard</h1><p>Welcome{profile.full_name ? `, ${profile.full_name}` : ''}.</p><p>Products: {products ?? 0}</p><p>Orders: {orders ?? 0}</p><Link href="/shop">View shop</Link></main>
}
