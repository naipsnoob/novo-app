import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface User {
  id: string
  email: string
  name?: string
  role: 'user' | 'admin'
  trial_start_date: string
  trial_end_date: string
  trial_active: boolean
  trial_duration_days: number
  bling_access_token?: string
  bling_refresh_token?: string
  bling_client_id?: string
  bling_client_secret?: string
  bling_connected: boolean
  bling_token_expires_at?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  user_id: string
  titulo: string
  descricao?: string
  imagem_url?: string
  galeria_imagens: string[]
  fornecedor?: string
  categoria_mercado_livre?: string
  categoria_magalu?: string
  categoria_bling?: string
  atributos_mercado_livre: Record<string, any>
  atributos_magalu: Record<string, any>
  preco_sugerido?: number
  status: 'draft' | 'active' | 'exported'
  grupo_id?: string
  nome_grupo?: string
  id_bling?: string
  codigo_bling?: string
  dados_completos_bling: Record<string, any>
  marketplaces_vinculados: string[]
  ncm?: string
  peso?: number
  largura?: number
  altura?: number
  profundidade?: number
  created_at: string
  updated_at: string
}
