import React from 'react';

export default function WhatsAppButton() {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER || '';
  const message = encodeURIComponent(import.meta.env.VITE_WHATSAPP_DEFAULT_MESSAGE || 'Olá! Gostaria de falar com a Locadora.');
  if (!number) return null;
  const href = `https://wa.me/${number.replace(/\D/g, '')}?text=${message}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500 shadow-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
      aria-label="Fale no WhatsApp"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-7 h-7 fill-white">
        <path d="M19.11 17.23c-.26-.13-1.53-.76-1.77-.85-.24-.09-.42-.13-.6.13-.18.26-.69.85-.84 1.03-.16.18-.31.2-.57.07-.26-.13-1.11-.41-2.11-1.31-.78-.7-1.31-1.56-1.46-1.82-.15-.26-.02-.4.11-.53.11-.11.26-.29.38-.44.13-.15.17-.26.26-.44.09-.18.04-.33-.02-.46-.06-.13-.6-1.45-.82-1.98-.22-.53-.44-.45-.6-.46-.15-.01-.33-.01-.51-.01-.18 0-.46.07-.69.33-.24.26-.9.88-.9 2.15s.92 2.49 1.05 2.66c.13.18 1.81 2.76 4.39 3.87.61.26 1.08.41 1.45.53.61.19 1.16.16 1.6.1.49-.07 1.53-.62 1.75-1.22.22-.6.22-1.11.15-1.22-.06-.11-.24-.18-.49-.31z"/>
        <path d="M27.67 4.33C24.86 1.52 21.1 0 17.11 0 9.13 0 2.67 6.46 2.67 14.44c0 2.54.67 5.02 1.95 7.22L2 30l8.5-2.22c2.13 1.16 4.54 1.77 6.98 1.77 7.98 0 14.44-6.46 14.44-14.44 0-3.99-1.52-7.75-4.33-10.56zM17.48 27.11c-2.22 0-4.39-.6-6.28-1.74l-.45-.27-5.04 1.32 1.35-4.92-.3-.5c-1.2-1.96-1.84-4.23-1.84-6.56C4.92 7.6 10.53 2 17.48 2c3.36 0 6.53 1.31 8.91 3.69 2.38 2.38 3.69 5.55 3.69 8.91 0 6.95-5.6 12.5-12.6 12.5z"/>
      </svg>
    </a>
  );
}
