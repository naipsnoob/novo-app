/**
 * Biblioteca para integração com a API do Bling
 * Documentação: https://developer.bling.com.br/aplicativos
 * 
 * IMPORTANTE: Todas as chamadas passam pela API Route /api/bling
 * para evitar problemas de CORS
 */

const BLING_AUTH_URL = 'https://www.bling.com.br/Api/v3/oauth/authorize'

export interface BlingTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
}

export interface BlingCredentials {
  clientId: string
  clientSecret: string
  accessToken?: string
  refreshToken?: string
}

/**
 * Troca o código de autorização por um access token
 * Via API Route (resolve CORS)
 */
export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<BlingTokenResponse> {
  const response = await fetch('/api/bling', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'exchangeToken',
      code,
      clientId,
      clientSecret,
      redirectUri,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erro ao trocar código por token')
  }

  return response.json()
}

/**
 * Renova o access token usando o refresh token
 * Via API Route (resolve CORS)
 */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<BlingTokenResponse> {
  const response = await fetch('/api/bling', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'refreshToken',
      refreshToken,
      clientId,
      clientSecret,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erro ao renovar token')
  }

  return response.json()
}

/**
 * Gera a URL de autorização do Bling
 */
export function getBlingAuthUrl(clientId: string, redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
  })

  if (state) {
    params.append('state', state)
  }

  return `${BLING_AUTH_URL}?${params.toString()}`
}

/**
 * Faz uma requisição autenticada para a API do Bling
 * Via API Route (resolve CORS)
 */
export async function blingApiRequest(
  endpoint: string,
  accessToken: string,
  options: { method?: string; body?: any } = {}
): Promise<any> {
  const response = await fetch('/api/bling', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'apiRequest',
      endpoint,
      accessToken,
      method: options.method || 'GET',
      body: options.body,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Erro na API do Bling')
  }

  return response.json()
}

/**
 * Busca produtos do Bling
 */
export async function getBlingProducts(accessToken: string, page = 1, limit = 100) {
  return blingApiRequest(`/produtos?pagina=${page}&limite=${limit}`, accessToken)
}

/**
 * Cria um produto no Bling
 */
export async function createBlingProduct(accessToken: string, productData: any) {
  return blingApiRequest('/produtos', accessToken, {
    method: 'POST',
    body: productData,
  })
}

/**
 * Atualiza um produto no Bling
 */
export async function updateBlingProduct(accessToken: string, productId: string, productData: any) {
  return blingApiRequest(`/produtos/${productId}`, accessToken, {
    method: 'PUT',
    body: productData,
  })
}
