import { useEffect } from 'react';

interface SeoHeadProps {
  title: string;
  description: string;
  canonical: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  jsonLd?: object | object[];
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertCanonical(href: string): void {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

/** Client-side SEO tags for SPA landing routes (title, description, OG, JSON-LD). */
export default function SeoHead({
  title,
  description,
  canonical,
  keywords,
  ogTitle,
  ogDescription,
  ogUrl,
  jsonLd,
}: SeoHeadProps) {
  useEffect(() => {
    document.title = title;
    upsertMeta('name', 'description', description);
    if (keywords) upsertMeta('name', 'keywords', keywords);
    upsertMeta('property', 'og:title', ogTitle ?? title);
    upsertMeta('property', 'og:description', ogDescription ?? description);
    upsertMeta('property', 'og:url', ogUrl ?? canonical);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', ogTitle ?? title);
    upsertMeta('name', 'twitter:description', ogDescription ?? description);
    upsertCanonical(canonical);

    const scriptId = 'page-jsonld';
    document.getElementById(scriptId)?.remove();
    if (jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = scriptId;
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => document.getElementById(scriptId)?.remove();
  }, [title, description, canonical, keywords, ogTitle, ogDescription, ogUrl, jsonLd]);

  return null;
}
