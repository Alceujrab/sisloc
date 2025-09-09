import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reservationService, formatters } from '../services/api';

function HistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await reservationService.getAll({ limit: 50 });
        if (!active) return;
        setItems(data.data.reservations || []);
      } catch (e) {
        setErr('Falha ao carregar histórico');
      } finally { setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  return (
    <section className="py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Histórico</h1>
          <Link to="/portal" className="text-blue-600 hover:text-blue-700 text-sm">Voltar ao Portal</Link>
        </div>
        {err && <div className="mb-3 p-3 rounded bg-red-50 text-red-700 text-sm">{err}</div>}
        <div className="bg-white border rounded-lg">
          <div className="grid grid-cols-4 gap-3 p-3 text-xs text-gray-500">
            <div>ID</div>
            <div>Tipo</div>
            <div>Data</div>
            <div className="text-right">Total</div>
          </div>
          <div className="divide-y">
            {loading && <div className="p-3 text-sm text-gray-600">Carregando…</div>}
            {!loading && items.length === 0 && <div className="p-3 text-sm text-gray-600">Sem reservas encontradas.</div>}
            {items.map(i => (
              <div key={i.id} className="grid grid-cols-4 gap-3 p-3 text-sm items-center">
                <Link className="text-blue-600" to={`/reservation/${i.id}`}>{i.reservation_code || `#${i.id}`}</Link>
                <div>Reserva</div>
                <div>{formatters.date(i.created_at)}</div>
                <div className="text-right">{formatters.currency(i.total_amount || 0)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 text-sm">
          <Link className="text-blue-600" to="/payments">Ver histórico de pagamentos</Link>
        </div>
      </div>
    </section>
  );
}

export default HistoryPage;
