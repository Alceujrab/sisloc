import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

function StatCard({ title, value, subtitle, color = 'bg-blue-600', onClick }) {
  const clickable = typeof onClick === 'function';
  return (
    <div
      className={`rounded-lg ${color} text-white p-4 shadow-sm ${clickable ? 'cursor-pointer hover:opacity-90 transition' : ''}`}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <div className="text-sm opacity-90">{title}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      {subtitle && <div className="text-xs mt-1 opacity-90">{subtitle}</div>}
    </div>
  );
}

function DateInput({ label, value, onChange }) {
  return (
    <label className="text-sm text-gray-700 flex items-center gap-2">
      <span>{label}</span>
      <input
        type="date"
        className="border rounded px-2 py-1"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  );
}

function ReportsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState({ reservationsDaily: [], revenueByGroup: [] });
  const [filters, setFilters] = useState({ startDate: '', endDate: '', branch: '' });
  const [branches, setBranches] = useState([]);

  const currency = useMemo(() => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }), []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const params = {};
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.branch) params.branch = filters.branch;
        const { data } = await adminService.getDashboard(params);
        if (!active) return;
        if (data?.success) {
          setStats(data.data.stats);
          setCharts(data.data.charts || { reservationsDaily: [], revenueByGroup: [] });
          // coletar lista de filiais vistas em resultados para facilitar seleção
          const dailyBranches = [];
          const currentBranch = data?.data?.filters?.branch;
          setBranches(prev => Array.from(new Set([...prev, ...(currentBranch ? [currentBranch] : [])])));
        } else {
          throw new Error(data?.message || 'Falha ao carregar relatórios');
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Erro inesperado');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [filters.startDate, filters.endDate, filters.branch]);

  const handleDrillDownPayments = () => {
    navigate('/payments?status=pending');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Relatórios</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <DateInput label="Início" value={filters.startDate} onChange={v => setFilters(f => ({ ...f, startDate: v }))} />
        <DateInput label="Fim" value={filters.endDate} onChange={v => setFilters(f => ({ ...f, endDate: v }))} />
        <label className="text-sm text-gray-700 flex items-center gap-2">
          <span>Filial</span>
          <input
            className="border rounded px-2 py-1"
            placeholder="Ex.: Centro"
            value={filters.branch}
            onChange={e => setFilters(f => ({ ...f, branch: e.target.value }))}
          />
        </label>
        <button
          className="ml-auto px-3 py-2 border rounded text-blue-700 border-blue-300 hover:bg-blue-50"
          onClick={() => setFilters({ startDate: '', endDate: '', branch: '' })}
        >
          Limpar filtros
        </button>
      </div>

      {loading && (
        <div className="text-gray-500">Carregando métricas…</div>
      )}

      {error && (
  <div className="text-blue-700">{error}</div>
      )}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard 
            title="Reservas no período" 
            value={stats.monthlyReservations ?? 0} 
            subtitle={`Variação: ${stats.reservationGrowth ?? 0}% vs período anterior`} 
          />
          <StatCard 
            title="Receita no período" 
            value={currency.format(stats.monthlyRevenue ?? 0)} 
            subtitle={`Crescimento: ${stats.revenueGrowth ?? 0}%`} 
          />
          <StatCard 
            title="Reservas ativas" 
            value={stats.activeReservations ?? 0} 
            color="bg-blue-700"
          />
          <StatCard 
            title="Pagamentos pendentes" 
            value={stats.pendingPayments ?? 0} 
            color="bg-blue-800"
            onClick={handleDrillDownPayments}
          />
          <StatCard 
            title="Veículos disponíveis" 
            value={stats.availableVehicles ?? 0} 
            color="bg-blue-900"
          />
        </div>
      )}

      {charts?.reservationsDaily?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Reservas por dia</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.reservationsDaily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip formatter={(v) => [v, 'Reservas']} />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#2563eb" name="Reservas" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {charts?.revenueByGroup?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Faturamento por grupo</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.revenueByGroup}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="group_code" fontSize={12} />
                <YAxis tickFormatter={(v) => currency.format(v)} fontSize={12} />
                <Tooltip formatter={(v) => [currency.format(v), 'Receita']} labelFormatter={(l) => `Grupo: ${l}`} />
                <Bar
                  dataKey="amount"
                  fill="#1e3a8a"
                  name="Receita"
                  onClick={(data) => {
                    if (!data?.activePayload?.[0]?.payload) return;
                    const gp = data.activePayload[0].payload;
                    // Drill-down: navegar para veículos filtrando por categoria/grupo (se houver rota dedicada)
                    navigate(`/vehicles?group=${encodeURIComponent(gp.group_code)}`);
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mt-6 text-gray-600">
        Em breve: taxa de ocupação, heatmap por filial e detalhamento por categoria de veículo.
      </div>
    </div>
  );
}

export default ReportsPage;
