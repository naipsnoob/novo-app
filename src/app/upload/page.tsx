"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, User, Product } from '@/lib/supabase'
import { getCurrentUser, signOut } from '@/lib/auth'
import { Sidebar } from '@/components/custom/sidebar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload as UploadIcon, Link as LinkIcon, Loader2, Image as ImageIcon, Sparkles, Save } from 'lucide-react'
import { toast } from 'sonner'
import { resizeImageTo1200x1200, uploadToImgBB } from '@/lib/imgbb'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

export default function UploadPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  // Upload local
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  
  // Upload por link
  const [productUrl, setProductUrl] = useState('')
  const [extracting, setExtracting] = useState(false)
  
  // Dados do produto
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState('')
  const [ncm, setNcm] = useState('')
  const [peso, setPeso] = useState('')
  const [largura, setLargura] = useState('')
  const [altura, setAltura] = useState('')
  const [profundidade, setProfundidade] = useState('')
  const [imagensExtraidas, setImagensExtraidas] = useState<string[]>([])
  
  useEffect(() => {
    loadUser()
  }, [])
  
  async function loadUser() {
    try {
      const userData = await getCurrentUser()
      if (!userData) {
        router.push('/login')
        return
      }
      setUser(userData)
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }
  
  async function handleLogout() {
    await signOut()
    router.push('/login')
  }
  
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
    
    // Criar previews
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setPreviews(newPreviews)
  }
  
  async function handleAnalyzeImages() {
    if (selectedFiles.length === 0) {
      toast.error('Selecione pelo menos uma imagem')
      return
    }
    
    setUploading(true)
    
    try {
      const uploadedUrls: string[] = []
      
      toast.info('Fazendo upload das imagens...')
      
      // Upload de cada imagem
      for (const file of selectedFiles) {
        const resized = await resizeImageTo1200x1200(file)
        const url = await uploadToImgBB(resized)
        uploadedUrls.push(url)
      }
      
      setImagensExtraidas(uploadedUrls)
      
      toast.info('Analisando imagens com IA...')
      
      // Gerar título e descrição com LLM
      const prompt = `Você é um especialista em e-commerce. Analise esta imagem de produto e extraia TODAS as informações possíveis.

IMPORTANTE: Seja MUITO detalhado e preciso. Extraia:

1. **Título do produto**: Crie um título atrativo e completo (60-80 caracteres) que inclua:
   - Nome do produto
   - Características principais
   - Marca (se visível)
   
2. **Descrição detalhada**: Escreva uma descrição profissional (300-500 caracteres) incluindo:
   - O que é o produto
   - Principais características e benefícios
   - Materiais e acabamento
   - Para quem é indicado
   - Diferenciais

3. **NCM**: Código NCM de 8 dígitos (pesquise o mais adequado para este tipo de produto)

4. **Dimensões estimadas**:
   - Peso em kg (seja realista)
   - Largura em cm
   - Altura em cm
   - Profundidade em cm

5. **Preço sugerido**: Estime um preço de venda justo em reais (R$)

Retorne em formato JSON válido:
{
  "titulo": "...",
  "descricao": "...",
  "ncm": "12345678",
  "peso": 0.5,
  "largura": 10,
  "altura": 15,
  "profundidade": 5,
  "preco": 99.90
}`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: uploadedUrls[0] } }
            ]
          }
        ],
        response_format: { type: 'json_object' },
      })
      
      const data = JSON.parse(response.choices[0].message.content || '{}')
      
      // Preencher campos
      setTitulo(data.titulo || '')
      setDescricao(data.descricao || '')
      setNcm(data.ncm || '')
      setPeso(data.peso?.toString() || '')
      setLargura(data.largura?.toString() || '')
      setAltura(data.altura?.toString() || '')
      setProfundidade(data.profundidade?.toString() || '')
      setPreco(data.preco?.toString() || '')
      
      toast.success('✨ Análise concluída! Revise os dados abaixo.')
      
    } catch (error: any) {
      toast.error(error.message || 'Erro ao analisar imagens')
    } finally {
      setUploading(false)
    }
  }
  
  async function handleSaveProduct() {
    if (!titulo) {
      toast.error('Preencha pelo menos o título do produto')
      return
    }
    
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          user_id: user!.id,
          titulo,
          descricao,
          imagem_url: imagensExtraidas[0] || previews[0],
          galeria_imagens: imagensExtraidas.length > 0 ? imagensExtraidas : [],
          preco_sugerido: preco ? parseFloat(preco) : null,
          ncm,
          peso: peso ? parseFloat(peso) : null,
          largura: largura ? parseFloat(largura) : null,
          altura: altura ? parseFloat(altura) : null,
          profundidade: profundidade ? parseFloat(profundidade) : null,
          status: 'draft',
        })
      
      if (error) throw error
      
      toast.success('✅ Produto salvo com sucesso!')
      
      // Limpar formulário
      setSelectedFiles([])
      setPreviews([])
      setImagensExtraidas([])
      setTitulo('')
      setDescricao('')
      setNcm('')
      setPeso('')
      setLargura('')
      setAltura('')
      setProfundidade('')
      setPreco('')
      
      // Redirecionar para produtos
      setTimeout(() => router.push('/products'), 1000)
      
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar produto')
    }
  }
  
  async function handleExtractFromUrl() {
    if (!productUrl) {
      toast.error('Insira uma URL válida')
      return
    }
    
    setExtracting(true)
    
    try {
      toast.info('Extraindo dados do link...')
      
      const prompt = `Você é um especialista em web scraping e e-commerce. Analise este link de produto e extraia TODAS as informações disponíveis:

URL: ${productUrl}

IMPORTANTE: Seja MUITO detalhado. Extraia:

1. **Título completo** do produto (como aparece no anúncio)
2. **Descrição detalhada** (todas as informações do anúncio)
3. **Preço** (valor exato em reais)
4. **NCM** (se disponível, senão sugira o mais adequado)
5. **Peso** em kg (se disponível, senão estime)
6. **Dimensões** em cm (largura, altura, profundidade)
7. **URLs das imagens** (todas as imagens do produto)
8. **Marca** (se disponível)
9. **Categoria** (tipo de produto)

Retorne em formato JSON válido:
{
  "titulo": "...",
  "descricao": "...",
  "preco": 99.90,
  "ncm": "12345678",
  "peso": 0.5,
  "largura": 10,
  "altura": 15,
  "profundidade": 5,
  "imagens": ["url1", "url2", "url3"],
  "marca": "...",
  "categoria": "..."
}`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
      })
      
      const data = JSON.parse(response.choices[0].message.content || '{}')
      
      // Preencher campos
      setTitulo(data.titulo || '')
      setDescricao(data.descricao || '')
      setPreco(data.preco?.toString() || '')
      setNcm(data.ncm || '')
      setPeso(data.peso?.toString() || '')
      setLargura(data.largura?.toString() || '')
      setAltura(data.altura?.toString() || '')
      setProfundidade(data.profundidade?.toString() || '')
      setImagensExtraidas(data.imagens || [])
      
      toast.success('✨ Dados extraídos! Revise e salve.')
      
    } catch (error: any) {
      toast.error(error.message || 'Erro ao extrair dados')
    } finally {
      setExtracting(false)
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">📦 Adicionar Produtos</h1>
            <p className="text-gray-600 mt-1">Faça upload de imagens ou cole o link de um anúncio</p>
          </div>
          
          <Tabs defaultValue="local" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="local">📸 Upload de Imagens</TabsTrigger>
              <TabsTrigger value="url">🔗 Extrair de Link</TabsTrigger>
            </TabsList>
            
            {/* Upload Local */}
            <TabsContent value="local">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coluna 1: Upload */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">1️⃣ Selecione as Imagens</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadIcon className="w-12 h-12 text-gray-400 mb-3" />
                          <p className="mb-2 text-sm text-gray-600">
                            <span className="font-semibold">Clique para fazer upload</span> ou arraste
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG até 10MB (múltiplas imagens)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*"
                          onChange={handleFileSelect}
                        />
                      </label>
                    </div>
                    
                    {previews.length > 0 && (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          {previews.map((preview, index) => (
                            <div key={index} className="relative aspect-square">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                              />
                            </div>
                          ))}
                        </div>
                        
                        <Button
                          onClick={handleAnalyzeImages}
                          disabled={uploading}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                          size="lg"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Analisando com IA...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5 mr-2" />
                              Analisar com IA
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
                
                {/* Coluna 2: Dados Extraídos */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">2️⃣ Dados do Produto</h2>
                  
                  {!titulo && !descricao ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                      <Sparkles className="w-16 h-16 mb-4" />
                      <p className="text-center">
                        Faça upload de imagens e clique em<br />
                        <strong>"Analisar com IA"</strong> para extrair os dados
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label>Título do Produto *</Label>
                        <Input 
                          value={titulo} 
                          onChange={(e) => setTitulo(e.target.value)}
                          placeholder="Ex: Camiseta Básica Algodão Premium"
                        />
                      </div>
                      
                      <div>
                        <Label>Descrição Completa</Label>
                        <Textarea
                          value={descricao}
                          onChange={(e) => setDescricao(e.target.value)}
                          rows={4}
                          placeholder="Descrição detalhada do produto..."
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Preço Sugerido (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={preco}
                            onChange={(e) => setPreco(e.target.value)}
                            placeholder="99.90"
                          />
                        </div>
                        
                        <div>
                          <Label>NCM (8 dígitos)</Label>
                          <Input
                            value={ncm}
                            onChange={(e) => setNcm(e.target.value)}
                            maxLength={8}
                            placeholder="12345678"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <Label>Peso (kg)</Label>
                          <Input
                            type="number"
                            step="0.001"
                            value={peso}
                            onChange={(e) => setPeso(e.target.value)}
                            placeholder="0.5"
                          />
                        </div>
                        
                        <div>
                          <Label>Largura (cm)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={largura}
                            onChange={(e) => setLargura(e.target.value)}
                            placeholder="10"
                          />
                        </div>
                        
                        <div>
                          <Label>Altura (cm)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={altura}
                            onChange={(e) => setAltura(e.target.value)}
                            placeholder="15"
                          />
                        </div>
                        
                        <div>
                          <Label>Prof. (cm)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={profundidade}
                            onChange={(e) => setProfundidade(e.target.value)}
                            placeholder="5"
                          />
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleSaveProduct}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                        size="lg"
                      >
                        <Save className="w-5 h-5 mr-2" />
                        Salvar Produto
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>
            
            {/* Por Link */}
            <TabsContent value="url">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coluna 1: Link */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">1️⃣ Cole o Link do Produto</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="url">URL do Anúncio</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="url"
                          type="url"
                          placeholder="https://produto.mercadolivre.com.br/..."
                          value={productUrl}
                          onChange={(e) => setProductUrl(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        ✅ Funciona com: Mercado Livre, Magalu, Shopee, Amazon, etc.
                      </p>
                    </div>
                    
                    <Button
                      onClick={handleExtractFromUrl}
                      disabled={extracting || !productUrl}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      size="lg"
                    >
                      {extracting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Extraindo dados...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Extrair Dados com IA
                        </>
                      )}
                    </Button>
                    
                    {imagensExtraidas.length > 0 && (
                      <div>
                        <Label className="mb-2 block">Imagens Encontradas:</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {imagensExtraidas.slice(0, 6).map((img, index) => (
                            <img
                              key={index}
                              src={img}
                              alt={`Imagem ${index + 1}`}
                              className="w-full aspect-square object-cover rounded-lg border-2 border-gray-200"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
                
                {/* Coluna 2: Dados Extraídos */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">2️⃣ Dados Extraídos</h2>
                  
                  {!titulo && !descricao ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                      <LinkIcon className="w-16 h-16 mb-4" />
                      <p className="text-center">
                        Cole o link de um produto e clique em<br />
                        <strong>"Extrair Dados com IA"</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label>Título do Produto *</Label>
                        <Input 
                          value={titulo} 
                          onChange={(e) => setTitulo(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label>Descrição Completa</Label>
                        <Textarea
                          value={descricao}
                          onChange={(e) => setDescricao(e.target.value)}
                          rows={4}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Preço (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={preco}
                            onChange={(e) => setPreco(e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label>NCM</Label>
                          <Input
                            value={ncm}
                            onChange={(e) => setNcm(e.target.value)}
                            maxLength={8}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <Label>Peso (kg)</Label>
                          <Input
                            type="number"
                            step="0.001"
                            value={peso}
                            onChange={(e) => setPeso(e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label>Larg. (cm)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={largura}
                            onChange={(e) => setLargura(e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label>Alt. (cm)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={altura}
                            onChange={(e) => setAltura(e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label>Prof. (cm)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={profundidade}
                            onChange={(e) => setProfundidade(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleSaveProduct}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                        size="lg"
                      >
                        <Save className="w-5 h-5 mr-2" />
                        Salvar Produto
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
