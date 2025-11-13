import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas públicas que não precisam de autenticação
const publicRoutes = ['/login']

// Rotas que precisam de autenticação
const protectedRoutes = [
  '/dashboard',
  '/products',
  '/create-ads',
  '/settings',
  '/bling-callback',
  '/admin'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Se for rota protegida, verificar autenticação
  if (isProtectedRoute) {
    // Em ambiente de servidor, não temos acesso ao localStorage
    // A verificação real será feita no lado do cliente
    // Aqui apenas garantimos que a rota existe
    return NextResponse.next()
  }
  
  // Redirecionar / para /login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
