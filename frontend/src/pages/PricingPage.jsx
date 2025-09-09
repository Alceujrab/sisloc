import React, { useEffect, useState } from 'react';
import Seo from '../components/Seo';
import { publicService, formatters } from '../services/api';

export default function PricingPage(){
  const [mins, setMins] = useState([]);

  useEffect(()=>{ 
    (async()=>{ 
      try { 
  const minsRes = await publicService.getGroupMinimums();
  setMins(minsRes?.data?.data?.minimums || []);
      } catch(_){}
    })(); 
  },[]);
  const faqs = [
    { q: 'Quanto custa alugar um carro?', a: 'Os valores variam conforme o grupo do carro, período e local. Faça uma busca para ver os preços do dia.' },
    { q: 'Há taxas adicionais?', a: 'Podem existir taxas de proteção, condutor adicional, acessórios e devolução em outra cidade.' },
    { q: 'Posso pagar online?', a: 'Sim, oferecemos pagamento online por cartão e também pagamento presencial com anexo de comprovante.' },
  ];

  return (
    <div>
      <Seo title="Quanto Custa" description="Entenda preços, taxas e formas de pagamento" />
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold">Quanto Custa</h1>
          <p className="mt-2 text-blue-100">Transparência em preços, proteções e formas de pagamento.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-3">Estimativas por grupo</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {mins.length === 0 && (
              <div className="text-gray-600">Sem dados no momento. Volte mais tarde.</div>
            )}
            {mins.map((m) => {
              const title = m.group_code && m.group_name
                ? `${m.group_code} — ${m.group_name}`
                : (m.group_id ? `Grupo ${m.group_id}` : 'Sem grupo');
              return (
                <div key={m.group_id || 'sem-grupo'} className="border rounded p-4">
                  <div className="font-medium">{title}</div>
                  <div className="text-blue-700 font-semibold">a partir de {formatters.currency(m.min_rate || 0)}/dia</div>
                </div>
              );
            })}
          </div>
        </div>
        <aside>
          <h3 className="text-lg font-semibold mb-3">Perguntas frequentes</h3>
          <ul className="space-y-3">
            {faqs.map((f, i) => (
              <li key={i}>
                <div className="font-medium">{f.q}</div>
                <div className="text-gray-700 text-sm">{f.a}</div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
