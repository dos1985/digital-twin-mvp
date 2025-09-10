// Простая проверка: есть ли что-то в /public/models
export async function probeModel(): Promise<string | null> {
  const candidates = [
    '/models/scene.gltf',
    '/models/scene.glb',
    '/models/pipeline.glb',
    '/models/pipeline.xkt',
    '/models/index.json'
  ]

  const exists = async (url: string) => {
    try {
      const r = await fetch(url, { method: 'HEAD', cache: 'no-store' })
      if (r.ok) return true
    } catch {}
    try {
      const r = await fetch(url, { method: 'GET', cache: 'no-store' })
      return r.ok
    } catch {}
    return false
  }

  for (const url of candidates) {
    if (await exists(url)) return url
  }
  return null
}
