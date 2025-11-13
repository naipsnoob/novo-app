"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { User } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Download, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  code: string
  price: number
  stock: number
  description: string
}

export default function ProductsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [importing, setImporting] = useState(false)

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

  async function handleImportProducts() {
    if (!user?.bling_connected) {
      toast.error('Conecte sua conta do Bling primeiro nas Configurações')
      return
    }

    setImporting(true)
    try {
      // Aqui você fará a chamada real para a API do Bling
      // Por enquanto, simulando dados
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Produto Exemplo 1',
          code: 'PROD001',
          price: 99.90,
          stock: 10,
          description: 'Descrição do produto 1'
        },
        {
          id: '2',
          name: 'Produto Exemplo 2',
          code: 'PROD002',
          price: 149.90,
          stock: 5,
          description: 'Descrição do produto 2'
        }
      ]
      
      setProducts(mockProducts)
      toast.success('Produtos importados com sucesso!')
    } catch (error) {
      toast.error('Erro ao importar produtos')
    } finally {
      setImporting(false)
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
                <p className="text-sm text-gray-600">Importar e gerenciar produtos do Bling</p>
              </div>
            </div>
            <Button
              onClick={handleImportProducts}
              disabled={importing || !user?.bling_connected}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Importar do Bling
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user?.bling_connected && (
          <Card className="p-6 bg-yellow-50 border-yellow-200 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 text-2xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-yellow-900">Bling não conectado</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  Você precisa conectar sua conta do Bling nas Configurações antes de importar produtos.
                </p>
                <Link href="/settings">
                  <Button variant="outline" size="sm" className="mt-3">
                    Ir para Configurações
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {products.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum produto importado
            </h3>
            <p className="text-gray-600 mb-6">
              Clique em "Importar do Bling" para começar
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-600">Código: {product.code}</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {product.stock} un.
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600">
                    R$ {product.price.toFixed(2)}
                  </span>
                  <Button size="sm" variant="outline">
                    Ver Detalhes
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
