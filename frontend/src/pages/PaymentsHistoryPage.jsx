import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentService, formatters } from '../services/api';

export default function PaymentsHistoryPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, isLoading, error } = useQuery(['my-payments', { page, status }], async () => {
    const res = await paymentService.getHistory({ page, limit: 10, status: status || undefined });
    return res.data?.data || res.data;
  });

  const rows = data?.payments || data?.rows || [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Meus Pagamentos</h1>
      <div className="card p-4 mb-4">
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Status</label>
            <select className="input" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Todos</option>
              <option value="pending">Pendente</option>
              <option value="processing">Processando</option>
              <option value="succeeded">Aprovado</option>
              <option value="failed">Falhou</option>
              <option value="cancelled">Cancelado</option>
              <option value="refunded">Estornado</option>
            </select>
          </div>
        </div>
      </div>
      {isLoading && <p className="text-gray-600">Carregando...</p>}
      {error && <p className="text-primary-700">Erro ao carregar pagamentos.</p>}
      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <Th>Reserva</Th>
                <Th>Valor</Th>
                <Th>Método</Th>
                <Th>Status</Th>
                <Th>Data</Th>
                <Th>Recibo</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(p => (
                <tr key={p.id} className="border-t">
                  <Td>{p.reservation?.reservation_code || p.reservation_id}</Td>
                  <Td>{formatters.currency(p.amount || 0)}</Td>
                  <Td>{p.payment_method}</Td>
                  <Td>{p.status}</Td>
                  <Td>{p.created_at ? new Date(p.created_at).toLocaleString() : '-'}</Td>
                  <Td>
                    {p.receipt_url ? (
                      <a href={absoluteUrl(p.receipt_url)} target="_blank" rel="noreferrer" className="text-primary-700 underline">Abrir</a>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </Td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-600">Nenhum pagamento encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {!isLoading && !error && pagination?.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
          <span className="px-3 py-2 text-sm text-gray-700">Página {pagination.currentPage} de {pagination.totalPages}</span>
          <button className="btn btn-outline" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Próxima</button>
        </div>
      )}
    </div>
  );
}

function absoluteUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `http://localhost:5000${url}`;
}

function Th({ children }) {
  return <th className="text-left p-2 border-b">{children}</th>;
}

function Td({ children }) {
  return <td className="p-2">{children}</td>;
}
