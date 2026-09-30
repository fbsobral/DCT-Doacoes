import { redirect } from 'next/navigation'
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  if (process.env.DEV_AUTH_BYPASS === 'true') {
    redirect('/admin')
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignIn />
    </div>
  )
}
