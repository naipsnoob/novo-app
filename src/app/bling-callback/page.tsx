"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { exchangeCodeForToken } from '@/lib/bling'
import { Card } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

function BlingCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processando autorização...')

  useEffect(() => {
    handleCallback()
  }, [])

  async function handleCallback() {
    try {
      const code = searchParams.get('code')
      const error = searchParams.get('error')

      if (error) {
        setStatus('error')
        setMessage('Autorização negada pelo Bling')
        setTimeout(() => router.push('/settings'), 3000)
        return
      }

      if (!code) {
        setStatus('error')
        setMessage('Código de autorização não encontrado')
        setTimeout(() => router.push('/settings'), 3000)
        return
      }

      // Recuperar estado (ID do usuário)
      const userId = localStorage.getItem('bling_auth_state')
      if (!userId) {
        setStatus('error')
        setMessage('Sessão expirada')
        setTimeout(() => router.push('/settings'), 3000)
        return
      }

      // Recuperar credenciais
      let clientId = ''
      let clientSecret = ''

      if (userId === 'admin-hardcoded') {
        // Admin hardcoded: usar localStorage
        clientId = localStorage.getItem('admin_bling_client_id') || ''
        clientSecret = localStorage.getItem('admin_bling_client_secret') || ''
      } else {
        // Usuário normal: buscar no Supabase
        try {
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('bling_client_id, bling_client_secret')
            .eq('id', userId)
            .single()

          if (userError) throw userError
          if (!user) throw new Error('Usuário não encontrado')

          clientId = user.bling_client_id || ''
          clientSecret = user.bling_client_secret || ''
        } catch (dbError) {
          console.error('Erro ao buscar usuário:', dbError)
          setStatus('error')
          setMessage('Erro ao buscar credenciais do usuário')
          setTimeout(() => router.push('/settings'), 3000)
          return
        }
      }

      if (!clientId || !clientSecret) {
        setStatus('error')
        setMessage('Credenciais não encontradas. Configure o Client ID e Secret primeiro.')
        setTimeout(() => router.push('/settings'), 3000)
        return
      }

      // Trocar código por access token usando a biblioteca
      const redirectUri = `${window.location.origin}/bling-callback`
      
      setMessage('Trocando código por token de acesso...')
      const tokenData = await exchangeCodeForToken(code, clientId, clientSecret, redirectUri)

      // Calcular data de expiração
      const expiresAt = new Date()
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in)

      // Salvar tokens
      if (userId === 'admin-hardcoded') {
        localStorage.setItem('admin_bling_access_token', tokenData.access_token)
        localStorage.setItem('admin_bling_refresh_token', tokenData.refresh_token)
        localStorage.setItem('admin_bling_token_expires_at', expiresAt.toISOString())
        localStorage.setItem('admin_bling_connected', 'true')
      } else {
        await supabase
          .from('users')
          .update({
            bling_access_token: tokenData.access_token,
            bling_refresh_token: tokenData.refresh_token,
            bling_token_expires_at: expiresAt.toISOString(),
            bling_connected: true,
          })
          .eq('id', userId)
      }

      // Limpar estado
      localStorage.removeItem('bling_auth_state')

      setStatus('success')
      setMessage('✅ Conectado com sucesso ao Bling!')
      setTimeout(() => router.push('/dashboard'), 2000)

    } catch (error: any) {
      console.error('Erro no callback:', error)
      setStatus('error')
      setMessage(error.message || 'Erro ao processar autorização')
      setTimeout(() => router.push('/settings'), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Processando...
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Sucesso!
              </h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500 mt-2">
                Redirecionando para o dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Erro
              </h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500 mt-2">
                Redirecionando para configurações...
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

export default function BlingCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Carregando...
            </h2>
          </div>
        </Card>
      </div>
    }>
      <BlingCallbackContent />
    </Suspense>
  )
}
