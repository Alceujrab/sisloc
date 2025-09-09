import React from 'react';
import Seo from '../components/Seo';

export default function LoyaltyPage(){
  const tiers = [
    { name: 'Green', points: '0-999 pts', perks: ['Descontos sazonais', 'Atendimento prioritário'] },
    { name: 'Gold', points: '1.000-2.999 pts', perks: ['Diárias bônus', 'Upgrade de grupo quando disponível'] },
    { name: 'Platinum', points: '3.000+ pts', perks: ['Benefícios exclusivos', 'Fila rápida e ofertas especiais'] },
  ];
  return (
    <div>
      <Seo title="Programa de Fidelidade" description="Ganhe pontos e benefícios" />
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold">Fidelidade</h1>
          <p className="mt-2 text-blue-100">Acumule pontos e desbloqueie benefícios em cada locação.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map(t => (
          <div key={t.name} className="border rounded-lg p-5">
            <div className="text-lg font-semibold">{t.name}</div>
            <div className="text-sm text-gray-500">{t.points}</div>
            <ul className="mt-3 list-disc pl-5 text-gray-700">
              {t.perks.map(p => <li key={p}>{p}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
