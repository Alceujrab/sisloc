import React from 'react';

export default function HowItWorksPage(){
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Como funciona</h1>
      <ol className="list-decimal pl-6 space-y-2 text-gray-700">
        <li>Escolha o veículo e datas.</li>
        <li>Faça sua reserva e pagamento.</li>
        <li>Apresente seus documentos no dia da retirada.</li>
        <li>Devolva no local combinado.</li>
      </ol>
    </div>
  );
}
