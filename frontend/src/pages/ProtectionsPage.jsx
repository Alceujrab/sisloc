import React from 'react';
import Seo from '../components/Seo';

export default function ProtectionsPage(){
  const protections = [
    { name: 'Proteção Básica', desc: 'Cobertura contra danos a terceiros e assistência 24h.', from: 'R$ 29/dia' },
    { name: 'Proteção Plus', desc: 'Inclui proteção de vidros/pneus e redução de franquia.', from: 'R$ 49/dia' },
    { name: 'Proteção Total', desc: 'Cobertura completa com franquia reduzida e carro reserva.', from: 'R$ 69/dia' },
  ];
  return (
    <div>
      <Seo title="Proteções" description="Opções de proteção e cobertura" />
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold">Proteções</h1>
          <p className="mt-2 text-blue-100">Escolha a cobertura que combina com a sua viagem.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {protections.map((p) => (
          <div key={p.name} className="border rounded-lg p-5">
            <div className="text-lg font-semibold">{p.name}</div>
            <p className="text-gray-700 mt-2">{p.desc}</p>
            <div className="mt-3 text-blue-700 font-semibold">{p.from}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
