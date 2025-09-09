import React, { useEffect, useState } from 'react';
import { adminService } from '../services/api';

export default function GroupsAdminPage(){
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', description: '', category: '', image_url: '', features: '' });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);

  const load = async()=>{
    const { data } = await adminService.getGroups();
    setGroups(data.data.groups || []);
  };

  useEffect(()=>{ (async()=>{ try { await load(); } finally { setLoading(false); } })(); },[]);

  const submit = async(e)=>{
    e.preventDefault();
    const payload = {
      code: form.code,
      name: form.name,
      description: form.description,
      category: form.category || null,
      image_url: form.image_url,
      features: form.features ? form.features.split('\n').map(s=>s.trim()).filter(Boolean) : []
    };
    let groupId = editing?.id;
    if (editing) {
      const res = await adminService.updateGroup(editing.id, payload);
      groupId = res.data?.data?.group?.id || editing.id;
    } else {
      const res = await adminService.createGroup(payload);
      groupId = res.data?.data?.group?.id;
    }

    // Upload da imagem se arquivo selecionado
    if (imageFile && groupId) {
      await adminService.uploadGroupImage(groupId, imageFile);
    }

    setForm({ code: '', name: '', description: '', category: '', image_url: '', features: '' });
    setImageFile(null);
    setEditing(null);
    await load();
  };

  const edit = (g)=>{
    setEditing(g);
    setForm({
      code: g.code || '',
      name: g.name || '',
      description: g.description || '',
      category: g.category || '',
      image_url: g.image_url || '',
      features: Array.isArray(g.features) ? g.features.join('\n') : ''
    });
    setImageFile(null);
  };

  const remove = async(id)=>{
    if (!confirm('Remover grupo?')) return;
    await adminService.deleteGroup(id);
    await load();
  };

  if(loading) return <div className="p-6">Carregando…</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Grupos de Carros</h1>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-600">Código</label>
          <input className="w-full border rounded px-3 py-2" value={form.code} onChange={e=>setForm({...form, code: e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Nome</label>
          <input className="w-full border rounded px-3 py-2" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Categoria</label>
          <select className="w-full border rounded px-3 py-2" value={form.category} onChange={e=>setForm({...form, category: e.target.value})}>
            <option value="">Selecione…</option>
            <option value="economico">Econômicos</option>
            <option value="suv">SUVs</option>
            <option value="pickup">Pick-ups</option>
            <option value="sedan">Sedans</option>
            <option value="luxo">Luxo</option>
            <option value="van">Vans</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600">Descrição</label>
          <textarea className="w-full border rounded px-3 py-2" rows="3" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Imagem (URL)</label>
          <input className="w-full border rounded px-3 py-2" value={form.image_url} onChange={e=>setForm({...form, image_url: e.target.value})} placeholder="Opcional se enviar arquivo" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Upload de imagem</label>
          <input type="file" accept="image/*" className="w-full" onChange={(e)=> setImageFile(e.target.files?.[0] || null)} />
          {(imageFile || form.image_url) && (
            <div className="mt-2">
              <img
                src={imageFile ? URL.createObjectURL(imageFile) : form.image_url}
                alt="Pré-visualização"
                className="w-32 h-20 object-cover rounded border"
              />
            </div>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600">Características (1 por linha)</label>
          <textarea className="w-full border rounded px-3 py-2" rows="4" value={form.features} onChange={e=>setForm({...form, features: e.target.value})} />
        </div>
        <div className="md:col-span-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">{editing ? 'Salvar alterações' : 'Adicionar grupo'}</button>
          {editing && <button type="button" className="ml-2 px-4 py-2 border rounded" onClick={()=>{ setEditing(null); setForm({ code: '', name: '', description: '', category: '', image_url: '', features: '' }); setImageFile(null); }}>Cancelar</button>}
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b"><th className="p-2">Código</th><th className="p-2">Nome</th><th className="p-2">Ativo</th><th className="p-2">Ações</th></tr>
          </thead>
          <tbody>
            {groups.map(g => (
              <tr key={g.id} className="border-b">
                <td className="p-2">{g.code}</td>
                <td className="p-2">{g.name}</td>
                <td className="p-2">{g.is_active ? 'Sim' : 'Não'}</td>
                <td className="p-2 space-x-2">
                  <button className="px-2 py-1 border rounded" onClick={()=>edit(g)}>Editar</button>
                  <button className="px-2 py-1 border rounded" onClick={()=>remove(g.id)}>Excluir</button>
                </td>
              </tr>
            ))}
            {groups.length===0 && <tr><td className="p-2" colSpan="4">Nenhum grupo cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
