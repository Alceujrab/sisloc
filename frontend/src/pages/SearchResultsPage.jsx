import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { vehicleService, formatters } from '../services/api';

export default function SearchResultsPage(){
  const [params] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let active = true;
    (async()=>{
      try{
        const { data } = await vehicleService.getAll(Object.fromEntries(params.entries()));
        if(!active) return;
        setItems(data.data.vehicles);
      } finally { setLoading(false); }
    })();
    return ()=>{ active=false };
  },[params]);

  if(loading) return <div className="p-4">Carregando…</div>;
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Resultados da busca</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map(v => (
          <Link key={v.id} to={`/vehicles/${v.id}`} className="border rounded hover:shadow">
            <img src={v.thumbnail || (v.images?.[0])} alt={v.model} className="w-full h-40 object-cover rounded-t" />
            <div className="p-3">
              <div className="font-medium">{v.brand} {v.model}</div>
              <div className="text-sm text-gray-600">{formatters.currency(v.daily_rate)} / dia</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
