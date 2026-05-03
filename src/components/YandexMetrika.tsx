'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'

const COUNTER_ID = 99248443

// Only run in production — no noise from localhost in Metrika reports
const IS_PROD = process.env.NODE_ENV === 'production'

export default function YandexMetrika() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Fire a virtual pageview on every client-side navigation
  useEffect(() => {
    if (!IS_PROD) return
    const url =
      pathname +
      (searchParams.toString() ? `?${searchParams.toString()}` : '')
    if (typeof window !== 'undefined' && typeof (window as unknown as Record<string, unknown>).ym === 'function') {
      ;(window as unknown as { ym: (id: number, action: string, url: string) => void }).ym(COUNTER_ID, 'hit', url)
    }
  }, [pathname, searchParams])

  if (!IS_PROD) return null

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`
          (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for(var j=0;j<document.scripts.length;j++){
              if(document.scripts[j].src===r){return;}
            }
            k=e.createElement(t);a=e.getElementsByTagName(t)[0];
            k.async=1;k.src=r;a.parentNode.insertBefore(k,a);
          })(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');

          ym(${COUNTER_ID},'init',{
            clickmap:true,
            trackLinks:true,
            accurateTrackBounce:true,
            webvisor:true
          });
        `}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${COUNTER_ID}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  )
}
