"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, User } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { getBlingAuthUrl } from '@/lib/bling'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, ExternalLink, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  
  useEffect(() => {
    loadData()
  }, [])
  
  async function loadData() {
    try {
      const userData = await getCurrentUser()
      if (!userData) {
        router.push('/login')
        return
      }
      setUser(userData)
      
      // Se for admin hardcoded, carregar do localStorage
      if (userData.id === 'admin-hardcoded') {
        setClientId(localStorage.getItem('admin_bling_client_id') || '')
        setClientSecret(localStorage.getItem('admin_bling_client_secret') || '')
        setIsConnected(localStorage.getItem('admin_bling_connected') === 'true')
      } else {
        setClientId(userData.bling_client_id || '')
        setClientSecret(userData.bling_client_secret || '')
        setIsConnected(userData.bling_connected || false)
      }
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }
  
  async function handleSaveCredentials() {
    if (!clientId || !clientSecret) {
      toast.error('Preencha o Client ID e o Client Secret')
      return
    }
    
    setSaving(true)
    
    try {
      // Se for admin hardcoded, salvar no localStorage
      if (user!.id === 'admin-hardcoded') {
        localStorage.setItem('admin_bling_client_id', clientId)
        localStorage.setItem('admin_bling_client_secret', clientSecret)
        toast.success('✅ Credenciais salvas! Agora conecte sua conta.')
      } else {
        // Usuário normal, salvar no banco
        const { error } = await supabase
          .from('users')
          .update({
            bling_client_id: clientId,
            bling_client_secret: clientSecret,
          })
          .eq('id', user!.id)
        
        if (error) throw error
        
        toast.success('✅ Credenciais salvas! Agora conecte sua conta.')
      }
      
      await loadData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }
  
  function handleConnectBling() {
    if (!clientId) {
      toast.error('Salve suas credenciais primeiro')
      return
    }
    
    const redirectUri = `${window.location.origin}/bling-callback`
    const authUrl = getBlingAuthUrl(clientId, redirectUri, user!.id)
    
    // Salvar estado para callback
    localStorage.setItem('bling_auth_state', user!.id)
    
    // Redirecionar para autorização
    window.location.href = authUrl
  }
  
  async function handleDisconnect() {
    try {
      if (user!.id === 'admin-hardcoded') {
        localStorage.removeItem('admin_bling_access_token')
        localStorage.removeItem('admin_bling_refresh_token')
        localStorage.removeItem('admin_bling_token_expires_at')
        localStorage.removeItem('admin_bling_connected')
        setIsConnected(false)
        toast.success('Desconectado do Bling')
      } else {
        const { error } = await supabase
          .from('users')
          .update({
            bling_access_token: null,
            bling_refresh_token: null,
            bling_token_expires_at: null,
            bling_connected: false,
          })
          .eq('id', user!.id)
        
        if (error) throw error
        
        setIsConnected(false)
        toast.success('Desconectado do Bling')
      }
      
      await loadData()
    } catch (error: any) {
      toast.error(error.message)
    }
  }
  
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
              <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
              <p className="text-sm text-gray-600">Configure sua integração com o Bling</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status da Conexão */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Status da Conexão</h3>
              <p className="text-sm text-gray-600 mt-1">
                {isConnected ? '✅ Conectado ao Bling' : '❌ Não conectado'}
              </p>
            </div>
            
            {isConnected ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
        </Card>
        
        {/* Guia Passo a Passo */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">📋 Guia de Configuração</h3>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Crie um App no Bling</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Acesse o painel do Bling e crie um novo aplicativo
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.open('https://developer.bling.com.br/aplicativos', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir Painel Bling
                </Button>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Configure a URL de Redirecionamento</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Use esta URL no seu app do Bling:
                </p>
                <code className="block mt-2 p-2 bg-gray-100 rounded text-xs break-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/bling-callback` : ''}
                </code>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Insira suas Credenciais</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Copie o Client ID e Client Secret do Bling e cole abaixo
                </p>
              </div>
            </div>
          </div>
        </Card>
        
        {/* Credenciais */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🔑 Credenciais do Bling</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Seu Client ID do Bling"
                disabled={isConnected}
              />
            </div>
            
            <div>
              <Label htmlFor="clientSecret">Client Secret</Label>
              <Input
                id="clientSecret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Seu Client Secret do Bling"
                disabled={isConnected}
              />
            </div>
            
            <div className="flex gap-2">
              {!isConnected ? (
                <>
                  <Button
                    onClick={handleSaveCredentials}
                    disabled={saving}
                    variant="outline"
                  >
                    {saving ? 'Salvando...' : '💾 Salvar Credenciais'}
                  </Button>
                  
                  <Button
                    onClick={handleConnectBling}
                    disabled={!clientId}
                    className="bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    🔗 Conectar com Bling
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleDisconnect}
                  variant="destructive"
                >
                  🔌 Desconectar
                </Button>
              )}
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
