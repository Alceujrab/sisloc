import React, { useEffect, useState } from 'react';
import { adminService } from '../services/api';

export default function LocationsAdminPage(){
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name:'', address:'', city:'', state:'', phone:'', email:'', map_url:'' });

  const load = async ()=>{
    const { data } = await adminService.getLocations();
    setItems(data.data.locations);
  };
  useEffect(()=>{ load(); },[]);

  const save = async (e)=>{
    e.preventDefault();
    await adminService.createLocation(form);
    setForm({ name:'', address:'', city:'', state:'', phone:'', email:'', map_url:'' });
    load();
  };

  const remove = async(id)=>{ await adminService.deleteLocation(id); load(); };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Locais/Filiais</h1>
      <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {['name','address','city','state','phone','email','map_url'].map(k=> (
          <input key={k} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={k} className="input input-bordered" />
        ))}
        <button className="btn btn-primary md:col-span-3">Adicionar</button>
      </form>
      <table className="w-full text-sm">
        <thead><tr className="text-left"><th>Nome</th><th>Endereço</th><th>Cidade</th><th>UF</th><th></th></tr></thead>
        <tbody>
          {items.map(i=> (
            <tr key={i.id} className="border-t">
              <td>{i.name}</td><td>{i.address}</td><td>{i.city}</td><td>{i.state}</td>
              <td className="text-right"><button onClick={()=>remove(i.id)} className="btn btn-ghost btn-sm text-blue-700 hover:text-blue-900">Remover</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
