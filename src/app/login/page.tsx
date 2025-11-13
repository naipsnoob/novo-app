"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    try {
      const user = await signIn(username, password)
      toast.success('Login realizado com sucesso!')
      
      // Redirecionar baseado no role
      if (user.role === 'admin') {
        router.push('/dashboard')
      } else {
        router.push('/products')
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao autenticar')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-4">
      <div className="absolute inset-0 bg-black/20"></div>
      
      <Card className="relative w-full max-w-md p-8 bg-white/95 backdrop-blur-sm shadow-2xl">
        {/* Logo 3D */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg transform hover:scale-105 transition-transform">
            <h1 className="text-4xl font-bold text-white">PG</h1>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-800">ProductGen</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestão inteligente de produtos
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
        
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800 text-center">
            💡 Use <strong>admin</strong> / <strong>Ipomea.2018</strong> para acesso administrativo
          </p>
        </div>
      </Card>
    </div>
  )
}
