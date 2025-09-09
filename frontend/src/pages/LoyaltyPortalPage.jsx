import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customerPortalService } from '../services/api';

function LoyaltyPortalPage() {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [tier, setTier] = useState('Azul');
  const [history, setHistory] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await customerPortalService.getLoyalty();
        if (!active) return;
        setPoints(data.data.points || 0);
        setTier(data.data.tier || 'Azul');
        setHistory(data.data.extract || []);
      } catch (e) {
        setErr('Falha ao carregar fidelidade');
      } finally { setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  return (
    <section className="py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Programa de Fidelidade</h1>
          <Link to="/portal" className="text-blue-600 hover:text-blue-700 text-sm">Voltar ao Portal</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white border rounded-lg p-4">
            <div className="text-sm text-gray-600">Seu nível</div>
            <div className="text-2xl font-semibold text-blue-700">{tier}</div>
            <div className="mt-4 text-sm text-gray-600">Pontos</div>
            <div className="text-2xl font-semibold">{points}</div>
            <button className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Resgatar</button>
          </div>

          <div className="md:col-span-2 bg-white border rounded-lg">
            <div className="p-4 border-b font-medium">Extrato</div>
            {err && <div className="p-4 text-sm text-red-700 bg-red-50">{err}</div>}
            {loading && <div className="p-4 text-sm text-gray-600">Carregando…</div>}
            {!loading && (
              <div className="divide-y">
                {history.map((h,i) => (
                  <div key={i} className="p-4 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{h.desc}</div>
                      <div className="text-gray-500 text-xs">{new Date(h.date).toLocaleString('pt-BR')}</div>
                    </div>
                    <div className={h.delta > 0 ? 'text-green-600' : 'text-red-600'}>
                      {h.delta > 0 ? '+' : ''}{Math.floor(h.delta)}
                    </div>
                  </div>
                ))}
                {history.length===0 && <div className="p-4 text-sm text-gray-600">Sem lançamentos.</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default LoyaltyPortalPage;
