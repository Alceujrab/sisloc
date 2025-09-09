import React, { useEffect, useRef, useState } from 'react';
import { adminService } from '../services/api';
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function UtilizationReportPage(){
  const today = new Date();
  const startDefault = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0,10);
  const endDefault = new Date(today.getFullYear(), today.getMonth()+1, 0).toISOString().slice(0,10);
  const [start, setStart] = useState(startDefault);
  const [end, setEnd] = useState(endDefault);
  const [groupId, setGroupId] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const load = async()=>{
    setLoading(true); setError(null);
    try{
      const params = { start, end };
      if (groupId) params.group_id = groupId;
      if (location) params.location = location;
      const { data } = await adminService.getUtilization(params);
      setReport(data.data);
    } catch(e){ setError(e.response?.data?.message || e.message || 'Falha ao carregar relatório'); }
    finally{ setLoading(false); }
  };

  useEffect(()=>{ load(); },[]);

  useEffect(()=>{
    if (!report?.series) return;
    const ctx = chartRef.current?.getContext('2d');
    if (!ctx) return;
    const labels = report.series.map(p => new Date(p.date).toLocaleDateString('pt-BR'));
    const values = report.series.map(p => p.utilization);
    if (chartInstance.current) { chartInstance.current.destroy(); }
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{ label: '% Utilização diária', data: values, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)', tension: 0.3, fill: true, pointRadius: 2 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true }, tooltip: { enabled: true } },
        scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => `${v}%` } } }
      }
    });
  }, [report]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Relatório de Utilização da Frota</h1>
      <div className="flex flex-wrap gap-3 mb-4">
        <div>
          <label className="text-sm text-gray-600">Início</label>
          <input type="date" className="border rounded px-2 py-1" value={start} onChange={e=>setStart(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-600">Fim</label>
          <input type="date" className="border rounded px-2 py-1" value={end} onChange={e=>setEnd(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-600">Grupo (opcional)</label>
          <input type="number" className="border rounded px-2 py-1" value={groupId} onChange={e=>setGroupId(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-600">Local (opcional)</label>
          <input className="border rounded px-2 py-1" value={location} onChange={e=>setLocation(e.target.value)} />
        </div>
        <button className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={load} disabled={loading}>
          {loading ? 'Carregando…' : 'Aplicar filtros'}
        </button>
      </div>

      {error && <div className="mb-3 p-2 rounded bg-red-50 text-red-700 text-sm">{error}</div>}

      {report && (
        <div className="space-y-4">
          <div className="p-3 border rounded">
            <div className="font-semibold mb-1">Resumo</div>
            <div className="text-sm text-gray-700">
              <div>Período: {new Date(report.summary.start).toLocaleDateString('pt-BR')} → {new Date(report.summary.end).toLocaleDateString('pt-BR')}</div>
              <div>Veículos considerados: {report.summary.totalVehicles}</div>
              <div>Dias no período: {report.summary.daysTotal}</div>
              <div>Utilização média da frota: <span className="font-semibold">{report.summary.utilization}%</span></div>
            </div>
          </div>
          <div className="p-3 border rounded">
            <div className="font-semibold mb-1">Utilização diária</div>
            <canvas ref={chartRef} height="120" />
          </div>
          <div className="p-3 border rounded">
            <div className="font-semibold mb-1">Por Grupo</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left"><th>Grupo</th><th>Veículos</th><th>Utilização</th></tr>
              </thead>
              <tbody>
                {report.groups.length === 0 && (
                  <tr><td colSpan="3" className="text-center text-gray-500 py-4">Sem dados.</td></tr>
                )}
                {report.groups.map(g => (
                  <tr key={String(g.group_id)} className="border-t">
                    <td>{String(g.group_id)}</td>
                    <td>{g.vehicles}</td>
                    <td>{g.utilization}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
