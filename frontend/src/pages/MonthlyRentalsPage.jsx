import React from 'react';
import Seo from '../components/Seo';

export default function MonthlyRentalsPage(){
  return (
    <div>
      <Seo title="Aluguel Mensal" description="Planos de longa duração" />
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold">Aluguel Mensal</h1>
          <p className="mt-2 text-blue-100">Economia para quem vai ficar mais tempo.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border rounded p-5">
            <div className="font-semibold">30 dias</div>
            <div className="text-blue-700 font-semibold">a partir de R$ 2.490/mês</div>
          </div>
          <div className="border rounded p-5">
            <div className="font-semibold">60 dias</div>
            <div className="text-blue-700 font-semibold">a partir de R$ 2.390/mês</div>
          </div>
          <div className="border rounded p-5">
            <div className="font-semibold">90 dias</div>
            <div className="text-blue-700 font-semibold">a partir de R$ 2.290/mês</div>
          </div>
        </div>
      </div>
    </div>
  );
}
