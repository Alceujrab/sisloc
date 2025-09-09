import React, { useEffect, useState } from 'react';
import { customerPortalService } from '../services/api';

export default function DocumentsPage(){
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = async()=>{
    const { data } = await customerPortalService.getDocuments();
    setDocs(data.data.documents || []);
  };

  useEffect(()=>{
    (async()=>{ try { await load(); } finally { setLoading(false); } })();
  },[]);

  const onUpload = async (type, file) => {
    if (!file) return;
    setUploading(true);
    try {
      await customerPortalService.uploadDocument(type, file);
      await load();
    } finally { setUploading(false); }
  };

  if(loading) return <div className="p-4">Carregando…</div>;

  const byType = (t) => docs.find(d => d.type === t);
  const renderBlock = (t, label) => {
    const d = byType(t);
    return (
      <div className="p-4 border rounded">
        <div className="font-semibold mb-1">{label}</div>
        <div className="text-sm text-gray-700 mb-2">Status: <span className="font-medium">{d?.status || 'pendente'}</span></div>
        <div className="flex items-center gap-2">
          <input type="file" accept="image/*,application/pdf" onChange={e => onUpload(t, e.target.files[0])} disabled={uploading} />
          {d?.file_url && <a className="text-primary-600" href={d.file_url} target="_blank" rel="noreferrer">ver arquivo</a>}
        </div>
        {d?.notes && <div className="text-xs text-gray-500 mt-2">Obs.: {d.notes}</div>}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Documentos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderBlock('cnh','CNH do condutor')}
        {renderBlock('address_proof','Comprovante de endereço')}
      </div>
    </div>
  );
}
