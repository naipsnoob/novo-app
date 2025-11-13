"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut } from '@/lib/auth'
import { User } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Users, Settings, LogOut, FileText } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }
      setUser(currentUser)
      setLoading(false)
    }
    loadUser()
  }, [router])

  async function handleLogout() {
    await signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <h1 className="text-2xl font-bold text-white">PG</h1>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">ProductGen</h2>
                <p className="text-sm text-gray-600">Bem-vindo, {user?.name}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Gerencie seus produtos e anúncios</p>
        </div>

        {/* Cards de Navegação */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Produtos */}
          <Link href="/products">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Produtos</h3>
                  <p className="text-sm text-gray-600">Importar e gerenciar produtos</p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Criar Anúncios */}
          <Link href="/create-ads">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-500">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Criar Anúncios</h3>
                  <p className="text-sm text-gray-600">Gerar e exportar anúncios</p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Configurações */}
          <Link href="/settings">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-500">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Settings className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Configurações</h3>
                  <p className="text-sm text-gray-600">Conectar API do Bling</p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Gerenciar Usuários (apenas admin) */}
          {user?.role === 'admin' && (
            <Link href="/admin/users">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-orange-500">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Users className="w-8 h-8 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Usuários</h3>
                    <p className="text-sm text-gray-600">Criar e gerenciar usuários</p>
                  </div>
                </div>
              </Card>
            </Link>
          )}
        </div>

        {/* Status do Trial */}
        {user?.trial_active && user.role !== 'admin' && (
          <Card className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Período de Teste</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Você tem acesso completo até {new Date(user.trial_end_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  {Math.ceil((new Date(user.trial_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                </p>
                <p className="text-sm text-gray-600">dias restantes</p>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}
