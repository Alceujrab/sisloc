import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customerPortalService, formatters } from '../services/api';

export default function CustomerDashboardPage(){
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let active = true;
    (async()=>{
      try{
        const { data } = await customerPortalService.getDashboard();
        if(!active) return;
        setData(data.data);
      } finally { setLoading(false); }
    })();
    return ()=>{ active=false };
  },[]);

  if(loading) return <div className="p-4">Carregando…</div>;
  if(!data) return null;

  const { metrics, upcomingReservations } = data;
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Bem-vindo</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded"><div className="text-sm text-gray-600">Reservas</div><div className="text-2xl font-bold">{metrics.totalReservations}</div></div>
        <div className="p-4 border rounded"><div className="text-sm text-gray-600">Pagas</div><div className="text-2xl font-bold">{metrics.paidReservations}</div></div>
        <div className="p-4 border rounded"><div className="text-sm text-gray-600">Pagamentos pendentes</div><div className="text-2xl font-bold">{metrics.pendingPayments}</div></div>
      </div>
      <h2 className="text-xl font-semibold mb-2">Próximas reservas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {upcomingReservations.map(r => (
          <Link key={r.id} to={`/reservation/${r.id}`} className="p-4 border rounded hover:shadow">
            <div className="flex gap-3 items-center">
              <img src={r.vehicle?.thumbnail || r.vehicle?.images?.[0]} alt={r.vehicle?.model} className="w-24 h-16 object-cover rounded" />
              <div>
                <div className="font-medium">{r.vehicle?.brand} {r.vehicle?.model}</div>
                <div className="text-sm text-gray-600">{formatters.date(r.start_date)} → {formatters.date(r.end_date)}</div>
              </div>
            </div>
          </Link>
        ))}
        {upcomingReservations.length === 0 && <div className="text-gray-600">Sem reservas futuras.</div>}
      </div>
    </div>
  );
}
