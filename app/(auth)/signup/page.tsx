"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Mail, Lock } from 'lucide-react'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      })
      return
    }
    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Password and confirm password must match.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name.trim() } },
      })

      if (error) throw error

      toast({
        title: "Account created",
        description: data.session ? "You are now signed in." : "Account created. You can sign in now.",
      })
      router.push(data.session ? '/auth/profile-setup' : '/auth/login')
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07100c] via-emerald-950 to-[#050b08] flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,0.08),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.08),transparent_26%)]" />
      <Card className="relative w-full max-w-md border border-emerald-900/60 bg-white/5 shadow-2xl shadow-emerald-950/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Create account</CardTitle>
          <CardDescription className="text-emerald-100/80">
            Register with email and password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-emerald-50">Full name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your full name"
                className="mt-1 bg-white/5 border-emerald-900/60 text-white placeholder:text-emerald-200/60"
              />
            </div>
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
            <div>
              <Label htmlFor="password" className="text-emerald-50">Password</Label>
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
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-emerald-100 hover:bg-white/5"
              onClick={() => router.push('/auth/login')}
            >
              Already have an account? Sign in
            </Button>
          </form>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 text-xs text-emerald-200/80 hover:text-emerald-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
