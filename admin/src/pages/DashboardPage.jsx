import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

function DashboardPage() {
  const { data, isLoading, error } = useQuery(['admin-dashboard'], async () => {
    const res = await api.get('/admin/dashboard');
    return res.data.data;
  });

  if (isLoading) return <p>Carregando...</p>;
  if (error) return <p>Erro ao carregar dashboard</p>;

  const { stats } = data;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric title="Veículos" value={stats.totalVehicles} />
        <Metric title="Disponíveis" value={stats.availableVehicles} />
        <Metric title="Clientes" value={stats.totalCustomers} />
        <Metric title="Reservas" value={stats.totalReservations} />
      </div>
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="border rounded p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold">{value ?? 0}</div>
    </div>
  );
}

export default DashboardPage;
