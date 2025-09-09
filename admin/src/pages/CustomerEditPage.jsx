import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../services/api';

export default function CustomerEditPage(){
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const load = async()=>{
    const { data } = await adminService.getCustomer(id);
    setC(data.data.customer);
  };

  useEffect(()=>{ load(); },[id]);

  const pick = ()=> fileRef.current?.click();
  const onFile = async(e)=>{
    const f = e.target.files?.[0];
    if(!f) return;
    await adminService.uploadCustomerAvatar(id, f);
    await load();
  };

  const removeAvatar = async()=>{
    await adminService.removeCustomerAvatar(id);
    await load();
  };

  const save = async()=>{
    setSaving(true);
    try {
      const payload = { name: c.name, email: c.email, phone: c.phone, status: c.status };
      await adminService.updateCustomer(id, payload);
      nav('/customers');
    } finally { setSaving(false); }
  };

  if(!c) return <div className="p-6">Carregando…</div>;

  return (
    <div className="p-6 max-w-3xl">
      <button className="mb-4 text-blue-600" onClick={()=>nav(-1)}>&larr; Voltar</button>
      <h1 className="text-2xl font-semibold mb-4">Editar Cliente #{c.id}</h1>

      <div className="flex items-center gap-4 mb-6">
        <img src={c.avatar || 'https://via.placeholder.com/96x96?text=%20'} alt={c.name} className="w-24 h-24 rounded object-cover border" />
        <div className="space-x-2">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
          <button className="px-3 py-1 border rounded" onClick={pick}>Anexar/Tirar foto</button>
          {c.avatar && <button className="px-3 py-1 border rounded" onClick={removeAvatar}>Remover foto</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600">Nome</label>
          <input className="w-full border rounded px-3 py-2" value={c.name||''} onChange={e=>setC({...c,name:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Email</label>
          <input className="w-full border rounded px-3 py-2" value={c.email||''} onChange={e=>setC({...c,email:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Telefone</label>
          <input className="w-full border rounded px-3 py-2" value={c.phone||''} onChange={e=>setC({...c,phone:e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Status</label>
          <select className="w-full border rounded px-3 py-2" value={c.status||'active'} onChange={e=>setC({...c,status:e.target.value})}>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="blocked">Bloqueado</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <button disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" onClick={save}>{saving?'Salvando…':'Salvar'}</button>
      </div>
    </div>
  );
}
