import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function LeadsAdminPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/leads', { params: { page: p, limit: 10, status: statusFilter || undefined, search: search || undefined, order: 'created_at:desc' } });
      setLeads((data?.data?.leads || []).sort((a,b)=> new Date(b.created_at||b.createdAt) - new Date(a.created_at||a.createdAt)));
      setTotalPages(data?.data?.pagination?.totalPages || 1);
      setPage(data?.data?.pagination?.currentPage || p);
    } catch(e){
      setError('Não foi possível carregar os leads agora.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); // eslint-disable-next-line
  }, []);

  const updateStatus = async (id, status) => {
    setOk(''); setError('');
    try {
      await api.patch(`/admin/leads/${id}/status`, { status });
      setOk('Status atualizado.');
      await load(page);
    } catch(e){
      setError('Falha ao atualizar status.');
    }
  };

  const badge = (s) => {
    const map = {
      new: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
      closed: 'bg-blue-200 text-blue-900 border-blue-300'
    };
    return <span className={`px-2 py-1 text-xs rounded border ${map[s]||'bg-gray-100 text-gray-800 border-gray-200'}`}>{s}</span>;
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Leads Corporativos</h1>

      {(error || ok) && (
        <div className="mb-3 space-y-2">
          {error && <div className="rounded border border-blue-200 bg-blue-50 text-blue-800 px-3 py-2 text-sm">{error}</div>}
          {ok && <div className="rounded border border-blue-200 bg-blue-50 text-blue-800 px-3 py-2 text-sm">{ok}</div>}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar por nome, e-mail, empresa" className="border rounded px-3 py-2" />
        <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className="border rounded px-3 py-2">
          <option value="">Todos</option>
          <option value="new">Novo</option>
          <option value="in_progress">Em andamento</option>
          <option value="closed">Fechado</option>
        </select>
        <button onClick={()=>load(1)} className="bg-blue-600 text-white px-4 py-2 rounded">Filtrar</button>
      </div>

      {loading ? (
        <div>Carregando...</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2">Data</th>
                <th className="text-left p-2">Empresa</th>
                <th className="text-left p-2">Contato</th>
                <th className="text-left p-2">E-mail</th>
                <th className="text-left p-2">Telefone</th>
                <th className="text-left p-2">Mensagem</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id} className="border-t">
                  <td className="p-2">{new Date(l.created_at || l.createdAt).toLocaleString('pt-BR')}</td>
                  <td className="p-2">{l.company || '-'}</td>
                  <td className="p-2">{l.name}</td>
                  <td className="p-2">{l.email}</td>
                  <td className="p-2">{l.phone || '-'}</td>
                  <td className="p-2 max-w-xs truncate" title={l.message || ''}>{l.message || '-'}</td>
                  <td className="p-2 flex items-center gap-2">
                    {badge(l.status)}
                    <select value={l.status} onChange={(e)=>updateStatus(l.id, e.target.value)} className="border rounded px-2 py-1">
                      <option value="new">Novo</option>
                      <option value="in_progress">Em andamento</option>
                      <option value="closed">Fechado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        <button disabled={page<=1} onClick={()=>load(page-1)} className="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
        <div>Página {page} de {totalPages}</div>
        <button disabled={page>=totalPages} onClick={()=>load(page+1)} className="px-3 py-1 border rounded disabled:opacity-50">Próxima</button>
      </div>
    </div>
  );
}
