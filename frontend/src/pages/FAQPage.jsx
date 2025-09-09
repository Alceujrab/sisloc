import React from 'react';
export default function FAQPage(){
  const faqs = [
    { q: 'Quais documentos são necessários?', a: 'CNH válida e documento com foto.' },
    { q: 'Há quilometragem limitada?', a: 'Depende do plano e veículo escolhido.' }
  ];
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Perguntas Frequentes</h1>
      <div className="space-y-4">
        {faqs.map((f,i)=> (
          <div key={i} className="p-4 border rounded">
            <h3 className="font-medium">{f.q}</h3>
            <p className="text-sm text-gray-700">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
