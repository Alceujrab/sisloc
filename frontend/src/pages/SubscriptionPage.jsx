import React from 'react';
import Seo from '../components/Seo';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SubscriptionPage(){
  const benefits = [
    'Carro sempre disponível sem burocracia',
    'Sem entrada, IPVA e manutenção inclusos',
    'Planos de 12, 24 ou 36 meses',
    'Troca programada e assistência 24h',
  ];
  return (
    <div className="bg-white">
      <Seo title="Planos de Assinatura" description="Assine um carro com tudo incluso" />
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold">Assinatura de Carros</h1>
          <p className="mt-2 text-blue-100">Tenha um carro por assinatura com tudo incluso e sem dor de cabeça.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Como funciona</h2>
          <p className="text-gray-700">Escolha um grupo de carros, selecione o prazo e quilometragem do plano e pronto: você usa como se fosse seu, com assistência e manutenção inclusas. No fim do período, renove, troque ou devolva.</p>
          <ul className="mt-4 space-y-2">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <CheckCircle2 className="text-blue-600 mt-0.5" size={18} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex gap-3">
            <Link to="/vehicles" className="btn btn-primary">Ver veículos</Link>
            <Link to="/contact" className="btn btn-outline">Falar com consultor</Link>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Simule seu plano</h3>
          <p className="text-gray-700 mb-4">Valores variam por grupo, prazo e franquia de km. Faça uma simulação rápida:</p>
          <div className="grid grid-cols-2 gap-3">
            <select className="border rounded px-3 py-2">
              <option>Grupo Econômico</option>
              <option>Grupo Sedan</option>
              <option>Grupo SUV</option>
            </select>
            <select className="border rounded px-3 py-2">
              <option>12 meses</option>
              <option>24 meses</option>
              <option>36 meses</option>
            </select>
            <select className="border rounded px-3 py-2 col-span-2">
              <option>1.000 km/mês</option>
              <option>2.000 km/mês</option>
              <option>3.000 km/mês</option>
            </select>
          </div>
          <div className="mt-4 p-4 bg-white rounded border">
            <p className="text-sm text-gray-600">Estimativa simulada</p>
            <p className="text-2xl font-bold text-blue-700">R$ 1.299/mês</p>
            <p className="text-xs text-gray-500">Exemplo ilustrativo. Consulte condições.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
