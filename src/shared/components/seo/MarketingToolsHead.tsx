import { useEffect, useState } from 'react'
import {
  getSiteSeoContent,
  subscribeSiteSeoChange,
  type MarketingToolEntry,
} from '@/features/cms/siteSeo.local'

function injectTool(tool: MarketingToolEntry): void {
  if (!tool.enabled || !tool.snippetId.trim()) return
  const id = tool.snippetId.trim()

  if (tool.provider === 'googleSiteVerification') {
    if (document.querySelector(`meta[name="google-site-verification"][content="${id}"]`)) return
    const meta = document.createElement('meta')
    meta.name = 'google-site-verification'
    meta.content = id
    document.head.appendChild(meta)
    return
  }

  if (tool.provider === 'gtm') {
    if (document.getElementById(`gtm-${id}`)) return
    const script = document.createElement('script')
    script.id = `gtm-${id}`
    script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`
    document.head.appendChild(script)
    return
  }

  if (tool.provider === 'ga4') {
    if (document.getElementById(`ga4-${id}`)) return
    const s = document.createElement('script')
    s.id = `ga4-${id}`
    s.async = true
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
    document.head.appendChild(s)
    const inline = document.createElement('script')
    inline.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`
    document.head.appendChild(inline)
    return
  }

  if (tool.provider === 'metaPixel') {
    if (document.getElementById(`fbp-${id}`)) return
    const script = document.createElement('script')
    script.id = `fbp-${id}`
    script.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`
    document.head.appendChild(script)
    return
  }

  if (tool.provider === 'hotjar') {
    if (document.getElementById(`hj-${id}`)) return
    const script = document.createElement('script')
    script.id = `hj-${id}`
    script.innerHTML = `(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${id},hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`
    document.head.appendChild(script)
    return
  }

  if (tool.provider === 'customScript' && id.startsWith('http')) {
    if (document.querySelector(`script[data-anvl-custom="${id}"]`)) return
    const script = document.createElement('script')
    script.async = true
    script.src = id
    script.dataset.anvlCustom = id
    document.head.appendChild(script)
  }
}

export function MarketingToolsHead() {
  const [tools, setTools] = useState(() => getSiteSeoContent().marketingTools ?? [])

  useEffect(() => {
    const sync = () => setTools(getSiteSeoContent().marketingTools ?? [])
    const unsub = subscribeSiteSeoChange(sync)
    sync()
    return unsub
  }, [])

  useEffect(() => {
    for (const tool of tools) injectTool(tool)
    const technical = getSiteSeoContent().technical
    if (technical?.robotsIndex === false) {
      let meta = document.querySelector('meta[name="robots"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'robots')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', 'noindex,nofollow')
    }
  }, [tools])

  return null
}
