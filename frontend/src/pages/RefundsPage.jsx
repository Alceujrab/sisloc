import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customerPortalService, formatters } from '../services/api';

function RefundsPage() {
  const [form, setForm] = useState({ reservation_code: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await customerPortalService.getRefunds({ limit: 20 });
      setItems(data.data.refunds || []);
    } catch (e) { setErr('Falha ao carregar solicitações'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    setSubmitting(true); setMsg(null); setErr(null);
    try {
      if (!form.reason) { setErr('Informe o motivo.'); setSubmitting(false); return; }
      await customerPortalService.createRefund({ reservation_code: form.reservation_code, reason: form.reason });
      setMsg('Solicitação enviada.');
      setForm({ reservation_code: '', reason: '' });
      load();
    } catch (e) {
      setErr(e.response?.data?.message || 'Erro ao enviar.');
    } finally { setSubmitting(false); }
  };

  return (
    <section className="py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Reembolsos</h1>
          <Link to="/portal" className="text-blue-600 hover:text-blue-700 text-sm">Voltar ao Portal</Link>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Solicitar reembolso</h2>
          {msg && <div className="mb-3 p-3 rounded bg-green-50 text-green-700 text-sm">{msg}</div>}
          {err && <div className="mb-3 p-3 rounded bg-red-50 text-red-700 text-sm">{err}</div>}
          <div className="space-y-3 text-sm">
            <input className="w-full border rounded px-3 py-2" placeholder="Código da reserva" value={form.reservation_code} onChange={(e)=>setForm(f=>({...f, reservation_code: e.target.value}))} />
            <textarea className="w-full border rounded px-3 py-2" rows="4" placeholder="Descreva o motivo" value={form.reason} onChange={(e)=>setForm(f=>({...f, reason: e.target.value}))} />
            <button onClick={submit} disabled={submitting} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Enviando...' : 'Enviar solicitação'}</button>
          </div>
        </div>

        <div className="mt-6 bg-white border rounded-lg">
          <div className="p-4 border-b font-medium">Minhas solicitações</div>
          {loading && <div className="p-4 text-sm text-gray-600">Carregando…</div>}
          {!loading && items.length === 0 && <div className="p-4 text-sm text-gray-600">Nenhuma solicitação ainda.</div>}
          {items.length > 0 && (
            <div className="divide-y">
              {items.map(r => (
                <div key={r.id} className="p-4 text-sm flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.reservation_code ? `Reserva ${r.reservation_code}` : `#${r.id}`}</div>
                    <div className="text-gray-500 text-xs">{formatters.dateTime(r.created_at)}</div>
                    <div className="text-gray-700 mt-1">{r.reason}</div>
                  </div>
                  <div className="text-xs px-2 py-1 rounded bg-gray-100">{r.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default RefundsPage;
