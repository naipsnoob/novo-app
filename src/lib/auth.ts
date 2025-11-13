import { supabase, User } from './supabase'

/**
 * Fazer login com email e senha
 */
export async function signIn(username: string, password: string): Promise<User> {
  // ADMIN HARDCODED
  if (username === 'admin' && password === 'Ipomea.2018') {
    const blingConnected = typeof window !== 'undefined' 
      ? localStorage.getItem('admin_bling_connected') === 'true'
      : false

    const adminUser: User = {
      id: 'admin-hardcoded',
      email: 'admin@productgen.com',
      name: 'Administrador',
      role: 'admin',
      trial_active: true,
      trial_start_date: new Date().toISOString(),
      trial_end_date: new Date(2099, 11, 31).toISOString(),
      trial_duration_days: 999999,
      bling_connected: blingConnected,
      password: '',
      created_at: new Date().toISOString()
    }

    // Salvar sessão no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_id', adminUser.id)
      localStorage.setItem('user_email', adminUser.email)
      localStorage.setItem('user_role', adminUser.role)
    }

    return adminUser
  }

  // Buscar usuário no banco
  const { data: users, error: queryError } = await supabase
    .from('users')
    .select('*')
    .eq('email', username)
    .single()

  if (queryError || !users) {
    throw new Error('Usuário ou senha incorretos')
  }

  // Verificar senha (comparação simples - em produção use bcrypt)
  if (users.password !== password) {
    throw new Error('Usuário ou senha incorretos')
  }

  // Verificar se trial está ativo
  const now = new Date()
  const trialEnd = new Date(users.trial_end_date)
  
  if (now > trialEnd) {
    throw new Error('Seu período de teste expirou. Entre em contato para renovar.')
  }

  // Salvar sessão no localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_id', users.id)
    localStorage.setItem('user_email', users.email)
    localStorage.setItem('user_role', users.role || 'user')
  }

  return users as User
}

/**
 * Criar nova conta (apenas admin pode criar)
 */
export async function createUser(email: string, password: string, name: string, createdBy: string): Promise<User> {
  // Verificar se email já existe
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) {
    throw new Error('Este email já está cadastrado')
  }

  // Calcular datas do trial (7 dias)
  const now = new Date()
  const trialEnd = new Date(now)
  trialEnd.setDate(trialEnd.getDate() + 7)

  // Criar usuário
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      email,
      password, // Em produção, use hash (bcrypt)
      name: name || email.split('@')[0],
      role: 'user',
      trial_start_date: now.toISOString(),
      trial_end_date: trialEnd.toISOString(),
      trial_active: true,
      trial_duration_days: 7,
      bling_connected: false,
    })
    .select()
    .single()

  if (error) {
    throw new Error('Erro ao criar conta: ' + error.message)
  }

  return newUser as User
}

/**
 * Obter usuário atual da sessão
 */
export async function getCurrentUser(): Promise<User | null> {
  if (typeof window === 'undefined') return null

  const userId = localStorage.getItem('user_id')
  if (!userId) return null

  // Verificar se é admin hardcoded
  if (userId === 'admin-hardcoded') {
    const blingConnected = localStorage.getItem('admin_bling_connected') === 'true'
    
    return {
      id: 'admin-hardcoded',
      email: 'admin@productgen.com',
      name: 'Administrador',
      role: 'admin',
      trial_active: true,
      trial_start_date: new Date().toISOString(),
      trial_end_date: new Date(2099, 11, 31).toISOString(),
      trial_duration_days: 999999,
      bling_connected: blingConnected,
      password: '',
      created_at: new Date().toISOString()
    }
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !user) {
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_role')
    return null
  }

  // Verificar se trial ainda está ativo (apenas verificação, sem UPDATE)
  const now = new Date()
  const trialEnd = new Date(user.trial_end_date)
  
  if (now > trialEnd && user.trial_active) {
    // Apenas atualizar localmente, sem fazer UPDATE no banco para evitar erro de permissão
    user.trial_active = false
  }

  return user as User
}

/**
 * Fazer logout
 */
export async function signOut(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_role')
  }
}

/**
 * Verificar se usuário é admin
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin'
}

/**
 * Calcular dias restantes do trial
 */
export function getTrialDaysRemaining(user: User): number {
  const now = new Date()
  const trialEnd = new Date(user.trial_end_date)
  const diffTime = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

/**
 * Obter cor do alerta de trial baseado nos dias restantes
 */
export function getTrialAlertColor(daysRemaining: number): string {
  if (daysRemaining === 0) {
    return 'bg-red-500/20 text-red-100 border border-red-500/30'
  } else if (daysRemaining <= 3) {
    return 'bg-orange-500/20 text-orange-100 border border-orange-500/30'
  } else {
    return 'bg-blue-500/20 text-blue-100 border border-blue-500/30'
  }
}
