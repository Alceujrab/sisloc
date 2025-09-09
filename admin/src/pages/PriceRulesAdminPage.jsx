import React, { useEffect, useMemo, useState } from 'react';
import { adminService } from '../services/api';

function Pill({ children, color = 'gray' }){
  const colors = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700'
  };
  return <span className={`px-2 py-0.5 text-xs rounded ${colors[color]||colors.gray}`}>{children}</span>;
}

export default function PriceRulesAdminPage(){
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // objeto da regra sendo editada
  const [form, setForm] = useState({
    name: '', description: '', group_id: '', location: '', start_date: '', end_date: '',
    days_of_week: [], adjustment_type: 'percent', adjustment_value: 0, priority: 0, is_active: true
  });

  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  const load = async(params={})=>{
    setError(null);
    const { data } = await adminService.getPriceRules(params);
    setRules(data.data.rules || []);
  };

  useEffect(()=>{(async()=>{ try{ await load(); } finally{ setLoading(false); } })();},[]);

  const onEdit = (rule)=>{
    setEditing(rule);
    setForm({
      name: rule.name || '',
      description: rule.description || '',
      group_id: rule.group_id || '',
      location: rule.location || '',
      start_date: rule.start_date ? rule.start_date.slice(0,10) : '',
      end_date: rule.end_date ? rule.end_date.slice(0,10) : '',
      days_of_week: (()=>{ try{ return JSON.parse(rule.days_of_week||'[]'); } catch{ return []; } })(),
      adjustment_type: rule.adjustment_type || 'percent',
      adjustment_value: Number(rule.adjustment_value || 0),
      priority: Number(rule.priority || 0),
      is_active: Boolean(rule.is_active)
    });
  };

  const onCreate = ()=>{
    setEditing({ id: null });
    setForm({ name:'', description:'', group_id:'', location:'', start_date:'', end_date:'', days_of_week:[], adjustment_type:'percent', adjustment_value:0, priority:0, is_active:true });
  };

  const save = async()=>{
    const payload = { ...form };
    payload.group_id = payload.group_id === '' ? null : Number(payload.group_id);
    payload.location = payload.location || null;
    payload.days_of_week = form.days_of_week.map(Number);
    payload.adjustment_value = Number(payload.adjustment_value);
    payload.priority = Number(payload.priority);
    try{
      if(editing?.id){
        await adminService.updatePriceRule(editing.id, payload);
      } else {
        await adminService.createPriceRule(payload);
      }
      setEditing(null);
      await load();
    } catch(e){ setError(e.response?.data?.message || e.message || 'Erro ao salvar'); }
  };

  const remove = async(id)=>{
    if(!confirm('Remover esta regra?')) return;
    try{
      await adminService.deletePriceRule(id);
      await load();
    } catch(e){ setError(e.response?.data?.message || e.message || 'Erro ao remover'); }
  };

  if(loading) return <div>Carregando…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Regras de Preço</h1>
        <button className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={onCreate}>Nova regra</button>
      </div>
      {error && <div className="mb-3 p-2 rounded bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th>Nome</th>
              <th>Filtros</th>
              <th>Ajuste</th>
              <th>Período</th>
              <th>Dias</th>
              <th>Prioridade</th>
              <th>Ativa</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rules.map(r => (
              <tr key={r.id} className="border-t">
                <td className="py-2">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.description}</div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {r.group_id && <Pill color="blue">Grupo #{r.group_id}</Pill>}
                    {r.location && <Pill color="yellow">Local {r.location}</Pill>}
                  </div>
                </td>
                <td>
                  {r.adjustment_type === 'percent' ? `${r.adjustment_value}%` : `R$ ${Number(r.adjustment_value).toFixed(2)}`}
                </td>
                <td>
                  {r.start_date ? new Date(r.start_date).toLocaleDateString('pt-BR') : '-'}
                  {' '}
                  {r.end_date ? `→ ${new Date(r.end_date).toLocaleDateString('pt-BR')}` : ''}
                </td>
                <td>
                  {(() => { try{ const d = JSON.parse(r.days_of_week||'[]'); return d.map(i=>days[i]).join(', ') || '-'; } catch { return '-'; } })()}
                </td>
                <td>{r.priority}</td>
                <td>{r.is_active ? <Pill color="green">Sim</Pill> : <Pill color="red">Não</Pill>}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button className="px-2 py-1 border rounded hover:bg-gray-50" onClick={()=>onEdit(r)}>Editar</button>
                    <button className="px-2 py-1 border rounded hover:bg-gray-50" onClick={()=>remove(r.id)}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan="8" className="text-center text-gray-500 py-6">Nenhuma regra cadastrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setEditing(null)} />
          <div className="relative bg-white rounded-md shadow-lg border w-full max-w-2xl p-4">
            <h2 className="text-lg font-semibold mb-3">{editing.id ? 'Editar' : 'Nova'} regra</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600">Nome</label>
                <input className="w-full border rounded px-2 py-1" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Descrição</label>
                <input className="w-full border rounded px-2 py-1" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Grupo (opcional)</label>
                <input type="number" className="w-full border rounded px-2 py-1" value={form.group_id} onChange={e=>setForm(f=>({...f,group_id:e.target.value}))} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Local (opcional)</label>
                <input className="w-full border rounded px-2 py-1" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Início (opcional)</label>
                <input type="date" className="w-full border rounded px-2 py-1" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Fim (opcional)</label>
                <input type="date" className="w-full border rounded px-2 py-1" value={form.end_date} onChange={e=>setForm(f=>({...f,end_date:e.target.value}))} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Dias da semana</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {days.map((d, i)=>{
                    const checked = form.days_of_week.includes(i);
                    return (
                      <label key={i} className={`px-2 py-1 border rounded cursor-pointer ${checked?'bg-blue-50 border-blue-300':'hover:bg-gray-50'}`}>
                        <input type="checkbox" className="mr-1" checked={checked} onChange={()=>{
                          setForm(f=>{
                            const s = new Set(f.days_of_week);
                            if(s.has(i)) s.delete(i); else s.add(i);
                            return { ...f, days_of_week: Array.from(s).sort((a,b)=>a-b) };
                          });
                        }} />
                        {d}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Tipo de ajuste</label>
                <select className="w-full border rounded px-2 py-1" value={form.adjustment_type} onChange={e=>setForm(f=>({...f,adjustment_type:e.target.value}))}>
                  <option value="percent">Percentual (%)</option>
                  <option value="amount">Valor fixo (R$)</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Valor</label>
                <input type="number" step="0.01" className="w-full border rounded px-2 py-1" value={form.adjustment_value} onChange={e=>setForm(f=>({...f,adjustment_value:e.target.value}))} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Prioridade</label>
                <input type="number" className="w-full border rounded px-2 py-1" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input id="rule-active" type="checkbox" checked={form.is_active} onChange={e=>setForm(f=>({...f,is_active:e.target.checked}))} />
                <label htmlFor="rule-active" className="text-sm text-gray-700">Regra ativa</label>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 border rounded hover:bg-gray-50" onClick={()=>setEditing(null)}>Cancelar</button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={save}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
