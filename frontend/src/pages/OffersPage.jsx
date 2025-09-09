import React, { useEffect, useState } from 'react';
import { publicService } from '../services/api';

export default function OffersPage(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let active = true;
    (async()=>{
      try{
        const { data } = await publicService.getOffers?.() || { data: { data: { coupons: [] } } };
        if(!active) return;
        setItems(data.data.coupons);
      } finally { setLoading(false); }
    })();
    return ()=>{ active=false };
  },[]);

  if(loading) return <div className="p-4">Carregando…</div>;
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Ofertas e Cupons</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(c => (
          <div key={c.id} className="p-4 border rounded">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">{c.code}</h3>
              <span className="text-xs px-2 py-1 rounded bg-primary-50 text-primary-700">{c.discount_type === 'percent' ? `${c.discount_value}%` : `R$ ${c.discount_value}`}</span>
            </div>
            {c.description && <p className="text-sm text-gray-700 mt-1">{c.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
