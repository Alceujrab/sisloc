import React, { useEffect, useState } from 'react';
import { publicService } from '../services/api';

export default function LocationsPage(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let active = true;
    (async()=>{
      try{
        const { data } = await publicService.getLocations?.() || { data: { data: { locations: [] } } };
        if(!active) return;
        setItems(data.data.locations);
      } finally { setLoading(false); }
    })();
    return ()=>{ active=false };
  },[]);

  if(loading) return <div className="p-4">Carregando…</div>;
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Nossas Filiais</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(loc => (
          <div key={loc.id} className="p-4 border rounded">
            <h3 className="font-medium">{loc.name}</h3>
            <p className="text-sm text-gray-700">{loc.address}, {loc.city} - {loc.state}</p>
            {loc.phone && <p className="text-sm">{loc.phone}</p>}
            {loc.map_url && (
              <a className="text-primary-600 text-sm" href={loc.map_url} target="_blank" rel="noreferrer">Ver no mapa</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
