import React from 'react';

function SettingsAdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Configurações</h1>
      <div className="space-y-4">
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-2">Geral</h2>
          <p className="text-gray-600">Parâmetros da empresa, horários, contato, branding.</p>
        </div>
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-2">Pagamentos</h2>
          <p className="text-gray-600">Chaves e provedores (ex.: Stripe), políticas e recibos.</p>
        </div>
      </div>
    </div>
  );
}

export default SettingsAdminPage;
