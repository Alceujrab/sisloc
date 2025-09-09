import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'react-hot-toast';

function ReservationsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useQuery(['admin-reservations', statusFilter], async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    const res = await api.get(`/admin/reservations?${params.toString()}`);
    return res.data.data;
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.put(`/admin/reservations/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries(['admin-reservations']); toast.success('Status atualizado'); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Erro ao atualizar status')
  });

  if (isLoading) return <p>Carregando...</p>;
  if (error) return <p className="text-blue-700">Erro ao carregar reservas</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reservas</h2>
        <select className="border rounded px-2 py-1" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          {['pending','confirmed','active','completed','cancelled'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-50">
            <tr>
              <Th>Código</Th>
              <Th>Cliente</Th>
              <Th>Veículo</Th>
              <Th>Período</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {data.reservations.map(r => (
              <tr key={r.id} className="border-t">
                <Td>{r.reservation_code}</Td>
                <Td>{r.customer?.name}</Td>
                <Td>{r.vehicle?.brand} {r.vehicle?.model}</Td>
                <Td>{new Date(r.start_date).toLocaleDateString()} - {new Date(r.end_date).toLocaleDateString()}</Td>
                <Td>{r.status}</Td>
                <Td>
                  <select
                    className="border rounded px-2 py-1"
                    defaultValue={r.status}
                    onChange={e => updateStatus.mutate({ id: r.id, status: e.target.value })}
                  >
                    {['pending','confirmed','active','completed','cancelled'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }) {
  return <th className="text-left p-2 border-b">{children}</th>;
}

function Td({ children }) {
  return <td className="p-2">{children}</td>;
}

export default ReservationsPage;
