"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Mail, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    setLoading(false)
    if (error) {
      toast({ title: 'Reset failed', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Check your email', description: 'We sent a reset link.' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07100c] via-emerald-950 to-[#050b08] flex items-center justify-center px-4">
      <Card className="relative w-full max-w-md border border-emerald-900/60 bg-white/5 shadow-2xl shadow-emerald-950/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Reset password</CardTitle>
          <CardDescription className="text-emerald-100/80">
            Enter your account email and we&apos;ll send a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-emerald-50">Email</Label>
              <div className="relative mt-1">
                <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-200/70" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="pl-10 bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
            <button
              type="button"
              onClick={() => router.push('/auth/login')}
              className="inline-flex items-center gap-2 text-xs text-emerald-200/80 hover:text-emerald-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
