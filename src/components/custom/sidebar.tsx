"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Upload, 
  Package, 
  Settings, 
  Users, 
  LogOut,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { User } from '@/lib/supabase'
import { getTrialDaysRemaining, getTrialAlertColor } from '@/lib/auth'

interface SidebarProps {
  user: User
  onLogout: () => void
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const daysRemaining = getTrialDaysRemaining(user)
  const alertColor = getTrialAlertColor(daysRemaining)
  
  const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Painel' },
    { href: '/upload', icon: Upload, label: 'Adicionar Produtos' },
    { href: '/products', icon: Package, label: 'Meus Produtos' },
    { href: '/settings', icon: Settings, label: 'Configurações' },
  ]
  
  const adminItems = [
    { href: '/admin/users', icon: Users, label: 'Gerenciar Usuários' },
  ]
  
  return (
    <div className="flex flex-col h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white border-r border-slate-700">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          ProductGen
        </h1>
        <p className="text-xs text-slate-400 mt-1">{user.email}</p>
      </div>
      
      {/* Trial Alert */}
      {user.trial_active && (
        <div className={cn(
          "mx-4 mt-4 p-3 rounded-lg flex items-start gap-2",
          alertColor
        )}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">
              {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Período de teste expirado'}
            </p>
            <p className="text-xs opacity-90">
              {daysRemaining > 0 ? 'no seu período de teste' : 'Entre em contato para renovar'}
            </p>
          </div>
        </div>
      )}
      
      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-700/50",
                  isActive && "bg-slate-700 text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Button>
            </Link>
          )
        })}
        
        {/* Admin Section */}
        {user.role === 'admin' && (
          <>
            <div className="pt-4 pb-2 px-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Administrador</p>
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-700/50",
                      isActive && "bg-slate-700 text-white"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </>
        )}
      </nav>
      
      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-red-600/20"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </Button>
      </div>
    </div>
  )
}
