import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function PaymentsPage() {
  const qc = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const [status, setStatus] = useState(params.get('status') || '');
  const [method, setMethod] = useState(params.get('method') || '');
  const [page, setPage] = useState(Number(params.get('page') || 1));

  // Sincroniza URL quando filtros mudam
  useEffect(() => {
    const next = new URLSearchParams();
    if (status) next.set('status', status);
    if (method) next.set('method', method);
    if (page && page !== 1) next.set('page', String(page));
    navigate({ pathname: '/payments', search: next.toString() }, { replace: true });
  }, [status, method, page]);

  const { data, isLoading, error } = useQuery(['admin-payments', { status, method, page }], async () => {
    const qs = new URLSearchParams();
    if (status) qs.append('status', status);
    if (method) qs.append('method', method);
    qs.append('page', String(page));
    qs.append('limit', '10');
    const res = await api.get(`/admin/payments?${qs.toString()}`);
    return res.data.data;
  });

  const update = useMutation({
    mutationFn: ({ id, status }) => api.put(`/admin/payments/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries(['admin-payments']); toast.success('Pagamento atualizado'); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Erro ao atualizar pagamento')
  });

  const methods = useMemo(() => ['credit_card','debit_card','pix','bank_transfer','cash'], []);
  const statuses = useMemo(() => ['pending','processing','succeeded','failed','cancelled','refunded'], []);

  if (isLoading) return <p>Carregando...</p>;
  if (error) return <p className="text-blue-700">Erro ao carregar pagamentos</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pagamentos</h2>
        <div className="flex gap-2">
          <select className="border rounded px-2 py-1" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Todos status</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="border rounded px-2 py-1" value={method} onChange={e => setMethod(e.target.value)}>
            <option value="">Todos métodos</option>
            {methods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-50">
            <tr>
              <Th>ID</Th>
              <Th>Reserva</Th>
              <Th>Cliente</Th>
              <Th>Método</Th>
              <Th>Canal</Th>
              <Th>Valor</Th>
              <Th>Status</Th>
              <Th>Recibo</Th>
            </tr>
          </thead>
          <tbody>
            {data.payments.map(p => (
              <tr key={p.id} className="border-t">
                <Td>#{p.id}</Td>
                <Td>{p.reservation?.reservation_code}</Td>
                <Td>{p.customer?.name}</Td>
                <Td>{p.payment_method}</Td>
                <Td>{p.payment_channel}</Td>
                <Td>R$ {Number(p.amount).toFixed(2)}</Td>
                <Td>
                  <select className="border rounded px-2 py-1" defaultValue={p.status} onChange={e => update.mutate({ id: p.id, status: e.target.value })}>
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Td>
                <Td>
                  {p.receipt_url ? <a className="text-blue-600 underline" href={p.receipt_url} target="_blank" rel="noreferrer">Abrir</a> : '-'}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.pagination?.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="px-3 py-2 border rounded" disabled={data.pagination.currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</button>
          <span className="text-sm">Página {data.pagination.currentPage} de {data.pagination.totalPages}</span>
          <button className="px-3 py-2 border rounded" disabled={data.pagination.currentPage >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)}>Próxima</button>
        </div>
      )}
    </div>
  );
}

function Th({ children }) { return <th className="text-left p-2 border-b">{children}</th>; }
function Td({ children }) { return <td className="p-2">{children}</td>; }
