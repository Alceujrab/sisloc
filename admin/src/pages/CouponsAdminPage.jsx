import React, { useEffect, useState } from 'react';
import { adminService } from '../services/api';

export default function CouponsAdminPage(){
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ code:'', description:'', discount_type:'percent', discount_value:10, is_public:true, is_active:true });

  const load = async ()=>{
    const { data } = await adminService.getCoupons();
    setItems(data.data.coupons);
  };
  useEffect(()=>{ load(); },[]);

  const save = async (e)=>{
    e.preventDefault();
    await adminService.createCoupon(form);
    setForm({ code:'', description:'', discount_type:'percent', discount_value:10, is_public:true, is_active:true });
    load();
  };
  const remove = async(id)=>{ await adminService.deleteCoupon(id); load(); };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Cupons</h1>
      <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <input value={form.code} onChange={e=>setForm({...form,code:e.target.value})} placeholder="Código" className="input input-bordered" />
        <input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Descrição" className="input input-bordered md:col-span-2" />
        <select value={form.discount_type} onChange={e=>setForm({...form,discount_type:e.target.value})} className="select select-bordered">
          <option value="percent">%</option>
          <option value="amount">R$</option>
        </select>
        <input type="number" step="0.01" value={form.discount_value} onChange={e=>setForm({...form,discount_value:e.target.value})} className="input input-bordered" />
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_public} onChange={e=>setForm({...form,is_public:e.target.checked})}/> Público</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> Ativo</label>
        <button className="btn btn-primary md:col-span-4">Adicionar</button>
      </form>
      <table className="w-full text-sm">
        <thead><tr className="text-left"><th>Código</th><th>Tipo</th><th>Valor</th><th>Público</th><th>Ativo</th><th></th></tr></thead>
        <tbody>
          {items.map(i=> (
            <tr key={i.id} className="border-t">
              <td>{i.code}</td>
              <td>{i.discount_type}</td>
              <td>{i.discount_value}</td>
              <td>{i.is_public ? 'Sim':'Não'}</td>
              <td>{i.is_active ? 'Sim':'Não'}</td>
              <td className="text-right"><button onClick={()=>remove(i.id)} className="btn btn-ghost btn-sm text-blue-700 hover:text-blue-900">Remover</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
