"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { User } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Send, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function CreateAdsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  const [formData, setFormData] = useState({
    productName: '',
    productCode: '',
    description: '',
    price: '',
    features: ''
  })
  
  const [generatedAd, setGeneratedAd] = useState('')

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

  async function handleGenerateAd() {
    if (!formData.productName || !formData.description) {
      toast.error('Preencha pelo menos o nome e descrição do produto')
      return
    }

    setGenerating(true)
    try {
      // Aqui você fará a chamada para gerar o anúncio com IA
      // Por enquanto, simulando
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockAd = `
🌟 ${formData.productName.toUpperCase()} 🌟

${formData.description}

✨ Características:
${formData.features || 'Produto de alta qualidade'}

💰 Preço: R$ ${formData.price || '0,00'}
📦 Código: ${formData.productCode || 'N/A'}

🚀 Aproveite esta oferta incrível!
      `.trim()
      
      setGeneratedAd(mockAd)
      toast.success('Anúncio gerado com sucesso!')
    } catch (error) {
      toast.error('Erro ao gerar anúncio')
    } finally {
      setGenerating(false)
    }
  }

  async function handleExportToBling() {
    if (!user?.bling_connected) {
      toast.error('Conecte sua conta do Bling primeiro nas Configurações')
      return
    }

    if (!generatedAd) {
      toast.error('Gere um anúncio primeiro')
      return
    }

    try {
      // Aqui você fará a chamada para exportar para o Bling
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success('Anúncio exportado para o Bling com sucesso!')
    } catch (error) {
      toast.error('Erro ao exportar anúncio')
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
              <h1 className="text-2xl font-bold text-gray-900">Criar Anúncios</h1>
              <p className="text-sm text-gray-600">Gere anúncios profissionais com IA</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Informações do Produto
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="productName">Nome do Produto *</Label>
                <Input
                  id="productName"
                  value={formData.productName}
                  onChange={(e) => setFormData({...formData, productName: e.target.value})}
                  placeholder="Ex: Camiseta Premium"
                />
              </div>

              <div>
                <Label htmlFor="productCode">Código do Produto</Label>
                <Input
                  id="productCode"
                  value={formData.productCode}
                  onChange={(e) => setFormData({...formData, productCode: e.target.value})}
                  placeholder="Ex: CAM001"
                />
              </div>

              <div>
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="99.90"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva o produto..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="features">Características</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData({...formData, features: e.target.value})}
                  placeholder="Liste as principais características..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleGenerateAd}
                disabled={generating}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {generating ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Anúncio com IA
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Preview do Anúncio */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Preview do Anúncio
            </h2>
            
            {generatedAd ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200 min-h-[300px]">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                    {generatedAd}
                  </pre>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleExportToBling}
                    disabled={!user?.bling_connected}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Exportar para Bling
                  </Button>
                  
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedAd)
                      toast.success('Anúncio copiado!')
                    }}
                    variant="outline"
                  >
                    Copiar
                  </Button>
                </div>

                {!user?.bling_connected && (
                  <p className="text-sm text-yellow-600 text-center">
                    ⚠️ Conecte o Bling nas Configurações para exportar
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-center">
                <div>
                  <div className="text-6xl mb-4">✨</div>
                  <p className="text-gray-600">
                    Preencha os dados e clique em<br />
                    "Gerar Anúncio com IA"
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
