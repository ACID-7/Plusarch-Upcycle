"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { ArrowLeft, Lock } from 'lucide-react'
import { getErrorMessage } from '@/lib/errors'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const hydrateSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setReady(true)
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'PASSWORD_RECOVERY' || !!session) {
        setReady(true)
      }
    })

    hydrateSession()

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast({
        title: 'Weak password',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'Password and confirm password must match.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      toast({
        title: 'Password updated',
        description: 'You can now sign in with your new password.',
      })
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Reset failed',
        description: getErrorMessage(error, 'Could not update password.'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07100c] via-emerald-950 to-[#050b08] flex items-center justify-center px-4">
      <Card className="relative w-full max-w-md border border-emerald-900/60 bg-white/5 shadow-2xl shadow-emerald-950/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Create new password</CardTitle>
          <CardDescription className="text-emerald-100/80">
            Set a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <div className="space-y-3 text-sm text-emerald-100/80">
              <p>Open this page from the reset link sent to your email.</p>
              <Button
                type="button"
                variant="ghost"
                className="px-0 text-emerald-200 hover:bg-transparent hover:text-emerald-100"
                onClick={() => router.push('/auth/forgot')}
              >
                Request another reset link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-emerald-50">New password</Label>
                <div className="relative mt-1">
                  <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200/70" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    className="pl-10 bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="confirm-password" className="text-emerald-50">Confirm password</Label>
                <div className="relative mt-1">
                  <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200/70" />
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Re-enter password"
                    className="pl-10 bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400" disabled={loading}>
                {loading ? 'Updating password...' : 'Update password'}
              </Button>
            </form>
          )}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => router.push('/auth/login')}
              className="inline-flex items-center gap-2 text-xs text-emerald-200/80 hover:text-emerald-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
