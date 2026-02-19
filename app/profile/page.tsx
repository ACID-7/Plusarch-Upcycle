"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  Edit,
  Plus,
  Trash2,
  Package
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

interface UserProfile {
  name: string
  phone: string
}

interface Address {
  id: string
  name: string
  address_line_1: string
  address_line_2?: string
  city: string
  state?: string
  postal_code?: string
  country: string
  is_default: boolean
}

interface NewAddress {
  name: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  postal_code: string
  country: string
  phone: string
}

interface Order {
  id: string
  status: string
  total_amount_lkr: number
  created_at: string
  order_items: Array<{
    product: { name: string } | null
    quantity: number
    price_lkr: number
  }>
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile>({ name: '', phone: '' })
  const [addresses, setAddresses] = useState<Address[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [phoneCode, setPhoneCode] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [newAddress, setNewAddress] = useState<NewAddress>({
    name: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Sri Lanka',
    phone: '',
  })
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('user_id', user.id)
        .single()

      if (profileData) {
        setProfile({ name: profileData.name || '', phone: profileData.phone || '' })
      }

      const { data: addressData } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (addressData) setAddresses(addressData as Address[])

      const { data: orderData } = await supabase
        .from('orders')
        .select('id, status, total_amount_lkr, created_at, order_items ( products ( name ), quantity, price_lkr )')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (orderData) {
        const normalized = (orderData as any[]).map((order) => ({
          ...order,
          order_items: (order.order_items || []).map((item: any) => ({
            ...item,
            product: Array.isArray(item.products) ? item.products[0] : item.products,
          })),
        }))
        setOrders(normalized as Order[])
      }

      setLoading(false)
    }

    loadData()
  }, [user, supabase])

  const handleUpdateProfile = async () => {
    try {
      if (!user) return
      await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          name: profile.name,
          phone: profile.phone,
        })
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
      setEditingProfile(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      })
    }
  }

  const handleAddAddress = async () => {
    try {
      if (!user) return
      if (!newAddress.name.trim() || !newAddress.address_line_1.trim() || !newAddress.city.trim() || !newAddress.country.trim()) {
        toast({
          title: "Missing required fields",
          description: "Please fill name, address line 1, city, and country.",
          variant: "destructive",
        })
        return
      }

      const { data, error } = await supabase
        .from('user_addresses')
        .insert({
          user_id: user.id,
          name: newAddress.name.trim(),
          phone: newAddress.phone.trim() || null,
          address_line_1: newAddress.address_line_1.trim(),
          address_line_2: newAddress.address_line_2.trim() || null,
          city: newAddress.city.trim(),
          state: newAddress.state.trim() || null,
          postal_code: newAddress.postal_code.trim() || null,
          country: newAddress.country.trim(),
          is_default: false,
        })
        .select()

      if (error) throw error
      if (data) setAddresses(prev => [...prev, ...(data as Address[])])
      setNewAddress({
        name: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'Sri Lanka',
        phone: '',
      })
      toast({
        title: "Address added",
        description: "New address has been added successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to add address.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const { error } = await supabase.from('user_addresses').delete().eq('id', addressId)
      if (error) throw error
      setAddresses(prev => prev.filter(address => address.id !== addressId))
      toast({ title: 'Address deleted' })
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete address.",
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
            <TabsTrigger value="orders" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="addresses" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <MapPin className="w-4 h-4 mr-2" />
              Addresses
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
                    Update your personal details and contact information. Use real data so we can verify orders and deliveries.
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
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white">Phone (verify via SMS)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="phone"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                          disabled={!editingProfile}
                          placeholder="+94XXXXXXXXX"
                        />
                        {editingProfile && (
                          <Button
                            type="button"
                            variant="outline"
                            className="border-emerald-200/50 text-emerald-50"
                            onClick={async () => {
                              if (!profile.phone) {
                                toast({ title: 'Phone required', description: 'Enter your real phone number first.', variant: 'destructive' })
                                return
                              }
                              setSendingCode(true)
                              const { error } = await supabase.auth.signInWithOtp({
                                phone: profile.phone,
                                options: { channel: 'sms' },
                              })
                              setSendingCode(false)
                              if (error) {
                                toast({ title: 'SMS failed', description: error.message, variant: 'destructive' })
                              } else {
                                toast({ title: 'Code sent', description: 'Enter the SMS code to verify.' })
                              }
                            }}
                            disabled={sendingCode}
                          >
                            {sendingCode ? 'Sending…' : 'Send Code'}
                          </Button>
                        )}
                      </div>
                      {editingProfile && (
                        <div className="flex gap-2">
                          <Input
                            value={phoneCode}
                            onChange={(e) => setPhoneCode(e.target.value)}
                            placeholder="Enter verification code"
                            className="bg-white/10 border-white/20 text-white"
                          />
                          <Button
                            type="button"
                            onClick={async () => {
                              if (!profile.phone || !phoneCode) return
                              setVerifyingCode(true)
                              const { error } = await supabase.auth.verifyOtp({
                                phone: profile.phone,
                                token: phoneCode,
                                type: 'sms',
                              })
                              setVerifyingCode(false)
                              if (error) {
                                toast({ title: 'Verification failed', description: error.message, variant: 'destructive' })
                              } else {
                                toast({ title: 'Phone verified', description: 'Your number is confirmed.' })
                                setPhoneCode('')
                              }
                            }}
                            disabled={verifyingCode}
                          >
                            {verifyingCode ? 'Verifying…' : 'Verify'}
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-gray-300">
                        Please provide accurate details; we use your number for order updates.
                      </p>
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

          {/* Orders Tab */}
          <TabsContent value="orders">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {orders.length === 0 ? (
                <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardContent className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No orders yet</h3>
                    <p className="text-gray-400 mb-4">Start shopping to see your order history here.</p>
                    <Link href="/catalog">
                      <Button className="bg-green-500 hover:bg-green-600">
                        Browse Products
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order) => (
                  <Card key={order.id} className="bg-white/5 backdrop-blur-sm border-white/10">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white">Order #{order.id}</CardTitle>
                          <CardDescription>
                            Placed on {new Date(order.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400">
                            LKR {order.total_amount_lkr.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-400 capitalize">{order.status}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {order.order_items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-300">
                              {item.product?.name ? `${item.product.name} × ${item.quantity}` : `Product removed × ${item.quantity}`}
                            </span>
                            <span className="text-white">
                              LKR {(item.price_lkr * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </motion.div>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Shipping Addresses</h3>
              </div>

              <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Add New Address</CardTitle>
                  <CardDescription>
                    Add a delivery address for online orders.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white">Address Name</Label>
                      <Input
                        value={newAddress.name}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="Home, Office..."
                      />
                    </div>
                    <div>
                      <Label className="text-white">Phone (optional)</Label>
                      <Input
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="+94XXXXXXXXX"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white">Address Line 1</Label>
                    <Input
                      value={newAddress.address_line_1}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, address_line_1: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Address Line 2 (optional)</Label>
                    <Input
                      value={newAddress.address_line_2}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, address_line_2: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Apartment, suite, unit..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white">City</Label>
                      <Input
                        value={newAddress.city}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">State/Province (optional)</Label>
                      <Input
                        value={newAddress.state}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white">Postal Code (optional)</Label>
                      <Input
                        value={newAddress.postal_code}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, postal_code: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Country</Label>
                      <Input
                        value={newAddress.country}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, country: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddAddress} className="bg-green-500 hover:bg-green-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Address
                  </Button>
                </CardContent>
              </Card>

              {addresses.map((address) => (
                <Card key={address.id} className="bg-white/5 backdrop-blur-sm border-white/10">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-white flex items-center">
                        {address.name}
                        {address.is_default && (
                          <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleDeleteAddress(address.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-300 space-y-1">
                      <p>{address.address_line_1}</p>
                      {address.address_line_2 && <p>{address.address_line_2}</p>}
                      <p>{address.city}, {address.postal_code}</p>
                      <p>{address.country}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
