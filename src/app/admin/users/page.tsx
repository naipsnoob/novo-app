"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, createUser, isAdmin } from '@/lib/auth'
import { supabase, User } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, UserPlus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function AdminUsersPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }

      if (!isAdmin(user)) {
        toast.error('Acesso negado. Apenas administradores.')
        router.push('/dashboard')
        return
      }

      setCurrentUser(user)
      await loadUsers()
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      toast.error('Erro ao carregar usuários')
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    
    if (!newUser.email || !newUser.password) {
      toast.error('Preencha email e senha')
      return
    }

    setCreating(true)
    try {
      await createUser(newUser.email, newUser.password, newUser.name, currentUser!.id)
      toast.success('Usuário criado com sucesso!')
      setNewUser({ email: '', password: '', name: '' })
      await loadUsers()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error
      
      toast.success('Usuário excluído com sucesso!')
      await loadUsers()
    } catch (error: any) {
      toast.error('Erro ao excluir usuário')
    }
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
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
              <p className="text-sm text-gray-600">Criar e gerenciar contas de usuários</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de Criar Usuário */}
          <Card className="p-6 lg:col-span-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Criar Novo Usuário
            </h2>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Nome do usuário"
                />
              </div>

              <div>
                <Label htmlFor="email">Email / Usuário *</Label>
                <Input
                  id="email"
                  type="text"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="usuario@exemplo.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={creating}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {creating ? 'Criando...' : 'Criar Usuário'}
              </Button>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 O usuário terá 7 dias de teste gratuito
                </p>
              </div>
            </form>
          </Card>

          {/* Lista de Usuários */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Usuários Cadastrados ({users.length})
            </h2>

            {users.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-600">Nenhum usuário cadastrado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:border-blue-300 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {user.name || user.email}
                        </h3>
                        {user.role === 'admin' && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                            Admin
                          </span>
                        )}
                        {user.trial_active && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Trial Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      {user.trial_active && (
                        <p className="text-xs text-gray-500">
                          Trial até: {new Date(user.trial_end_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>

                    {user.role !== 'admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
