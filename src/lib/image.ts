// 选图 → 压到合适尺寸的 data URI，再交给 /api/upload
export function compressImage(file: File, maxSize = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          const scale = maxSize / Math.max(width, height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('canvas 不可用')); return }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('图片读不出来'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('文件读不出来'))
    reader.readAsDataURL(file)
  })
}

// data URI → Supabase Storage 公网地址
export async function uploadImage(dataUri: string, folder = 'messages'): Promise<string> {
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_data: dataUri, folder }),
  })
  const data = await res.json()
  if (!res.ok || !data.url) throw new Error(data.error || '上传失败')
  return data.url as string
}
