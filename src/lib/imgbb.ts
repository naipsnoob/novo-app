import axios from 'axios'

const IMGBB_API_KEY = process.env.IMGBB_API_KEY!

export async function uploadToImgBB(base64Image: string): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('key', IMGBB_API_KEY)
    formData.append('image', base64Image.replace(/^data:image\/\w+;base64,/, ''))
    
    const response = await axios.post(
      'https://api.imgbb.com/1/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    
    return response.data.data.url
  } catch (error) {
    console.error('Erro ao fazer upload para ImgBB:', error)
    throw new Error('Falha ao fazer upload da imagem')
  }
}

export function resizeImageTo1200x1200(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Não foi possível criar contexto do canvas'))
          return
        }
        
        // Redimensionar para 1200x1200
        canvas.width = 1200
        canvas.height = 1200
        
        // Calcular dimensões para manter proporção
        const scale = Math.max(1200 / img.width, 1200 / img.height)
        const x = (1200 - img.width * scale) / 2
        const y = (1200 - img.height * scale) / 2
        
        // Fundo branco
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, 1200, 1200)
        
        // Desenhar imagem centralizada
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
        
        // Converter para base64
        const base64 = canvas.toDataURL('image/jpeg', 0.9)
        resolve(base64)
      }
      
      img.onerror = () => reject(new Error('Erro ao carregar imagem'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
    reader.readAsDataURL(file)
  })
}
