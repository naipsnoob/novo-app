import { NextRequest, NextResponse } from 'next/server'

const BLING_API_BASE = 'https://api.bling.com.br/Api/v3'
const BLING_TOKEN_URL = 'https://www.bling.com.br/Api/v3/oauth/token'

/**
 * API Route para proxy de requisições ao Bling
 * Resolve problemas de CORS fazendo as chamadas pelo servidor
 */
export async function POST(request: NextRequest) {
  console.log('🔵 [BLING API] Requisição recebida')
  
  try {
    const body = await request.json()
    const { action, ...params } = body

    console.log('🔵 [BLING API] Action:', action)
    console.log('🔵 [BLING API] Params:', { ...params, clientSecret: '***', accessToken: '***' })

    switch (action) {
      case 'exchangeToken':
        return await handleExchangeToken(params)
      
      case 'refreshToken':
        return await handleRefreshToken(params)
      
      case 'apiRequest':
        return await handleApiRequest(params)
      
      default:
        console.error('🔴 [BLING API] Ação inválida:', action)
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('🔴 [BLING API] Erro geral:', error)
    console.error('🔴 [BLING API] Stack:', error.stack)
    
    return NextResponse.json(
      { 
        error: error.message || 'Erro desconhecido',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Troca código de autorização por access token
 */
async function handleExchangeToken(params: any) {
  const { code, clientId, clientSecret, redirectUri } = params

  console.log('🟡 [EXCHANGE TOKEN] Iniciando troca de código')
  console.log('🟡 [EXCHANGE TOKEN] Client ID:', clientId)
  console.log('🟡 [EXCHANGE TOKEN] Redirect URI:', redirectUri)
  console.log('🟡 [EXCHANGE TOKEN] Code:', code?.substring(0, 10) + '...')

  // Validação de parâmetros
  if (!code || !clientId || !clientSecret || !redirectUri) {
    console.error('🔴 [EXCHANGE TOKEN] Parâmetros faltando')
    throw new Error('Parâmetros obrigatórios faltando: code, clientId, clientSecret, redirectUri')
  }

  const requestBody = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  })

  console.log('🟡 [EXCHANGE TOKEN] URL:', BLING_TOKEN_URL)
  console.log('🟡 [EXCHANGE TOKEN] Body:', requestBody.toString().replace(clientSecret, '***'))

  try {
    const response = await fetch(BLING_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: requestBody,
    })

    console.log('🟡 [EXCHANGE TOKEN] Status:', response.status)
    console.log('🟡 [EXCHANGE TOKEN] Headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('🟡 [EXCHANGE TOKEN] Response:', responseText)

    if (!response.ok) {
      console.error('🔴 [EXCHANGE TOKEN] Erro HTTP:', response.status)
      console.error('🔴 [EXCHANGE TOKEN] Resposta:', responseText)
      
      throw new Error(`Erro ${response.status} ao trocar código por token: ${responseText}`)
    }

    const data = JSON.parse(responseText)
    console.log('✅ [EXCHANGE TOKEN] Sucesso! Token obtido')
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('🔴 [EXCHANGE TOKEN] Erro na requisição:', error)
    throw error
  }
}

/**
 * Renova access token usando refresh token
 */
async function handleRefreshToken(params: any) {
  const { refreshToken, clientId, clientSecret } = params

  console.log('🟡 [REFRESH TOKEN] Iniciando renovação de token')
  console.log('🟡 [REFRESH TOKEN] Client ID:', clientId)

  // Validação de parâmetros
  if (!refreshToken || !clientId || !clientSecret) {
    console.error('🔴 [REFRESH TOKEN] Parâmetros faltando')
    throw new Error('Parâmetros obrigatórios faltando: refreshToken, clientId, clientSecret')
  }

  const requestBody = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  })

  console.log('🟡 [REFRESH TOKEN] URL:', BLING_TOKEN_URL)

  try {
    const response = await fetch(BLING_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: requestBody,
    })

    console.log('🟡 [REFRESH TOKEN] Status:', response.status)

    const responseText = await response.text()
    console.log('🟡 [REFRESH TOKEN] Response:', responseText)

    if (!response.ok) {
      console.error('🔴 [REFRESH TOKEN] Erro HTTP:', response.status)
      console.error('🔴 [REFRESH TOKEN] Resposta:', responseText)
      
      throw new Error(`Erro ${response.status} ao renovar token: ${responseText}`)
    }

    const data = JSON.parse(responseText)
    console.log('✅ [REFRESH TOKEN] Sucesso! Token renovado')
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('🔴 [REFRESH TOKEN] Erro na requisição:', error)
    throw error
  }
}

/**
 * Faz requisição autenticada para API do Bling
 */
async function handleApiRequest(params: any) {
  const { endpoint, accessToken, method = 'GET', body: requestBody } = params

  console.log('🟡 [API REQUEST] Iniciando requisição')
  console.log('🟡 [API REQUEST] Endpoint:', endpoint)
  console.log('🟡 [API REQUEST] Method:', method)

  // Validação de parâmetros
  if (!endpoint || !accessToken) {
    console.error('🔴 [API REQUEST] Parâmetros faltando')
    throw new Error('Parâmetros obrigatórios faltando: endpoint, accessToken')
  }

  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  }

  if (requestBody && method !== 'GET') {
    options.body = JSON.stringify(requestBody)
    console.log('🟡 [API REQUEST] Body:', JSON.stringify(requestBody, null, 2))
  }

  const fullUrl = `${BLING_API_BASE}${endpoint}`
  console.log('🟡 [API REQUEST] URL completa:', fullUrl)

  try {
    const response = await fetch(fullUrl, options)

    console.log('🟡 [API REQUEST] Status:', response.status)
    console.log('🟡 [API REQUEST] Headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('🟡 [API REQUEST] Response:', responseText)

    if (!response.ok) {
      console.error('🔴 [API REQUEST] Erro HTTP:', response.status)
      console.error('🔴 [API REQUEST] Resposta:', responseText)
      
      throw new Error(`Erro ${response.status} na API do Bling: ${responseText}`)
    }

    const data = JSON.parse(responseText)
    console.log('✅ [API REQUEST] Sucesso!')
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('🔴 [API REQUEST] Erro na requisição:', error)
    throw error
  }
}

/**
 * Permite requisições OPTIONS (CORS preflight)
 */
export async function OPTIONS(request: NextRequest) {
  console.log('🔵 [BLING API] OPTIONS request (CORS preflight)')
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
