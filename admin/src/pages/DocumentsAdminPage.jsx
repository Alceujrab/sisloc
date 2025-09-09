import React, { useEffect, useState } from 'react';
import { adminService } from '../services/api';

export default function DocumentsAdminPage(){
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState('');

  const load = async()=>{
    const { data } = await adminService.getDocuments({ status: status || undefined, user_id: userId || undefined });
    setDocs(data.data.documents || []);
  };

  useEffect(()=>{ (async()=>{ try{ await load(); } finally { setLoading(false); } })(); },[]);

  const changeStatus = async(id, newStatus) => {
    await adminService.updateDocumentStatus(id, { status: newStatus });
    await load();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Documentos de Clientes</h1>
      <div className="flex gap-2 mb-4">
        <select className="border rounded px-2 py-1" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovados</option>
          <option value="rejected">Rejeitados</option>
        </select>
        <input className="border rounded px-2 py-1" placeholder="User ID" value={userId} onChange={e=>setUserId(e.target.value)} />
        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={load}>Filtrar</button>
      </div>
      {loading ? <div>Carregando…</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b"><th className="p-2">ID</th><th className="p-2">Usuário</th><th className="p-2">Tipo</th><th className="p-2">Arquivo</th><th className="p-2">Status</th><th className="p-2">Ações</th></tr>
            </thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id} className="border-b">
                  <td className="p-2">{d.id}</td>
                  <td className="p-2">{d.user?.name} <span className="text-gray-500 text-xs">#{d.user_id}</span></td>
                  <td className="p-2">{d.type}</td>
                  <td className="p-2">{d.file_url ? <a className="text-blue-600" href={d.file_url} target="_blank" rel="noreferrer">abrir</a> : '-'}</td>
                  <td className="p-2">{d.status}</td>
                  <td className="p-2 space-x-2">
                    <button className="px-2 py-1 border rounded" onClick={()=>changeStatus(d.id,'approved')}>Aprovar</button>
                    <button className="px-2 py-1 border rounded" onClick={()=>changeStatus(d.id,'rejected')}>Rejeitar</button>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr><td className="p-2" colSpan="6">Nenhum documento encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
