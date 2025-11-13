"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    checkAuth()
  }, [])
  
  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  )
}
