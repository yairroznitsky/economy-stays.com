import { siteConfig } from "@/lib/siteConfig";

/** Loads Meta/TikTok/Google Ads tags when deployment env IDs are set. */
export const initAnalytics = (): void => {
  const { metaPixelId, tiktokPixelId, googleAdsId } = siteConfig;

  if (googleAdsId) {
    const gtagScript = document.createElement("script");
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`;
    document.head.appendChild(gtagScript);

    const inlineScript = document.createElement("script");
    inlineScript.text = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      gtag('config', '${googleAdsId}');
    `;
    document.head.appendChild(inlineScript);
  }

  if (metaPixelId) {
    const metaScript = document.createElement("script");
    metaScript.text = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${metaPixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(metaScript);

    const noscript = document.createElement("noscript");
    noscript.innerHTML = `<img height="1" width="1" style="display:none"
      src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1" />`;
    document.body.appendChild(noscript);
  }

  if (tiktokPixelId) {
    const tiktokScript = document.createElement("script");
    tiktokScript.text = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
      var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
      ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
        ttq.load('${tiktokPixelId}');
        ttq.page();
      }(window, document, 'ttq');
    `;
    document.head.appendChild(tiktokScript);
  }
};
