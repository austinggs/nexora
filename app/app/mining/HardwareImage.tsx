'use client'

import { useEffect, useRef, useState } from 'react'

type Props = { brand?: string | null; model: string; category: string; size?: number }

export function HardwareImage({ brand, model, category, size = 92 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    let cancelled = false
    const observer = new IntersectionObserver(async entries => {
      if (!entries.some(e => e.isIntersecting)) return
      observer.disconnect()
      const q = encodeURIComponent([brand, model].filter(Boolean).join(' '))
      try {
        const wiki = await fetch(`https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrlimit=1&prop=pageimages|info&inprop=url&piprop=thumbnail&pithumbsize=600&format=json&origin=*`).then(r => r.ok ? r.json() : null)
        const page = wiki?.query?.pages ? Object.values(wiki.query.pages)[0] as any : null
        if (page?.thumbnail?.source && !cancelled) {
          setSrc(page.thumbnail.source)
          setSource(page.fullurl ?? 'https://www.wikipedia.org/')
          return
        }
        const commons = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${q}&gsrlimit=1&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=600&format=json&origin=*`).then(r => r.ok ? r.json() : null)
        const cpage = commons?.query?.pages ? Object.values(commons.query.pages)[0] as any : null
        if (cpage?.imageinfo?.[0]?.thumburl && !cancelled) {
          setSrc(cpage.imageinfo[0].thumburl)
          setSource(cpage.imageinfo[0]?.descriptionurl ?? 'https://commons.wikimedia.org/')
        }
      } catch { /* image enrichment is best-effort; catalog remains usable */ }
    }, { rootMargin: '240px' })
    observer.observe(node)
    return () => { cancelled = true; observer.disconnect() }
  }, [brand, model])

  return <div ref={ref} title={source ? `Image source: ${source}` : `${category} image`} style={{width:size,height:size,borderRadius:16,overflow:'hidden',background:'rgba(255,255,255,.05)',display:'grid',placeItems:'center',border:'1px solid rgba(255,255,255,.08)'}}>
    {src ? <img src={src} alt={`${brand ?? ''} ${model}`.trim()} loading="lazy" referrerPolicy="no-referrer" style={{width:'100%',height:'100%',objectFit:'contain'}} /> : <span className="muted" style={{fontSize:10,textAlign:'center',padding:8}}>Loading image…</span>}
  </div>
}
