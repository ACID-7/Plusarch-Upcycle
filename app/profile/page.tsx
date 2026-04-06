"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { fetchProfile, upsertProfile } from '@/lib/auth-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User,
  Heart,
  Edit,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface UserProfile {
  name: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile>({ name: '' })
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false)
        router.push('/auth/login?next=/profile')
        return
      }

      const profileData = await fetchProfile(supabase, user.id)

      if (profileData) {
        setProfile({ name: profileData.name || '' })
      }

      setLoading(false)
    }

    loadData()
  }, [router, supabase, user])

  const handleUpdateProfile = async () => {
    try {
      if (!user) return
      await upsertProfile(supabase, {
        userId: user.id,
        name: profile.name,
      })
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
      setEditingProfile(false)
    } catch {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-slate-900">
      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">My Account</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </motion.div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white/10 border border-white/20 flex flex-wrap h-auto justify-start">
            <TabsTrigger value="profile" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <Heart className="w-4 h-4 mr-2" />
              Wishlist
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-white">Full Name</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="bg-white/10 border-white/20 text-white"
                        disabled={!editingProfile}
                        placeholder="Enter your real name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input
                        id="email"
                        value={user?.email || ''}
                        className="bg-white/10 border-white/20 text-white"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {!editingProfile ? (
                      <Button
                        onClick={() => setEditingProfile(true)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button onClick={handleUpdateProfile} className="bg-green-500 hover:bg-green-600">
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingProfile(false)}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardContent className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Quick access to wishlist</h3>
                  <p className="text-gray-400 mb-4">View and manage your saved items.</p>
                  <Link href="/wishlist">
                    <Button className="bg-green-500 hover:bg-green-600">
                      <Heart className="w-4 h-4 mr-2" />
                      Go to Wishlist
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
