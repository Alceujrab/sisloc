import React from 'react';

export default function ShareButtons({ url = window.location.href, text = 'Confira esta oferta de locação de veículos!' }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); alert('Link copiado!'); } catch { /* no-op */ }
  };
  const shareNative = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: document.title, text, url }); } catch { /* no-op */ }
    } else {
      copyLink();
    }
  };
  return (
    <div className="flex items-center gap-2">
      <a href={fbHref} target="_blank" rel="noreferrer" className="btn btn-outline">Facebook</a>
      <button type="button" onClick={shareNative} className="btn btn-outline">Compartilhar</button>
      <button type="button" onClick={copyLink} className="btn btn-outline">Copiar link</button>
    </div>
  );
}
