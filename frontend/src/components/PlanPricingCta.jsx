import React from 'react';
import { Link } from 'react-router-dom';

export default function PlanPricingCta({ className = '' }) {
  return (
    <section className={`mt-10 ${className}`}>
      <div className="rounded-xl overflow-hidden bg-gradient-to-r from-blue-700 to-blue-600 text-white">
        <div className="px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
          <div className="flex-1">
            <h3 className="text-2xl font-semibold">Planos e Preços</h3>
            <p className="mt-2 text-blue-100">Conheça nossos planos de assinatura e veja preços a partir por grupo.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/plans"
              className="inline-flex items-center justify-center rounded-md bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 font-medium"
            >
              Ver Planos
            </Link>
            <Link
              to="/quanto-custa"
              className="inline-flex items-center justify-center rounded-md bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 font-medium border border-white/20"
            >
              Ver Preços
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
