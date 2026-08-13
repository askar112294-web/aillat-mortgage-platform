import { redirect } from 'next/navigation'
import AdminPanel from '@/components/admin-panel'
import { isAdminAuthenticated } from '@/lib/admin-auth'

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated()

  if (!authenticated) {
    redirect('/admin/login')
  }

  return <AdminPanel />
}