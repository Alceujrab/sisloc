import React from 'react';

const key = 'cookie-consent-v1';

export default function CookieConsent() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const accepted = localStorage.getItem(key);
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(key, 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-xl z-50">
      <div className="bg-white border shadow-lg rounded-lg p-4 flex flex-col md:flex-row md:items-start gap-3">
        <div className="text-sm text-gray-700">
          Usamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossa <a className="text-blue-700 underline" href="/privacy">Política de Privacidade</a>.
        </div>
        <div className="flex-shrink-0">
          <button className="btn btn-primary" onClick={accept}>Aceitar</button>
        </div>
      </div>
    </div>
  );
}
