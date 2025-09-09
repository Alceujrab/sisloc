import React, { useState } from 'react';
import Seo from '../components/Seo';
import { publicService } from '../services/api';

export default function BusinessPage(){
  const [form, setForm] = useState({ company: '', name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState({ loading: false, ok: false, error: '' });
  const bullets = [
    'Faturamento mensal e condições corporativas',
    'Gestão de frota e centralização de contas',
    'Atendimento dedicado e SLAs',
  ];
  return (
    <div>
      <Seo title="Para Empresas" description="Soluções de mobilidade para sua empresa" />
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold">Para Empresas</h1>
          <p className="mt-2 text-blue-100">Planos sob medida para sua operação.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-3">Benefícios</h2>
          <ul className="space-y-2 list-disc pl-5 text-gray-700">
            {bullets.map(b => <li key={b}>{b}</li>)}
          </ul>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Fale com nosso time</h3>
          <form className="grid grid-cols-1 gap-3" onSubmit={async (e)=>{
            e.preventDefault();
            setStatus({ loading: true, ok: false, error: '' });
            try {
              await publicService.createBusinessLead(form);
              setStatus({ loading: false, ok: true, error: '' });
              setForm({ company: '', name: '', email: '', phone: '', message: '' });
            } catch (err) {
              setStatus({ loading: false, ok: false, error: 'Não foi possível enviar. Tente novamente.' });
            }
          }}>
            <input className="border rounded px-3 py-2" placeholder="Empresa" value={form.company} onChange={e=>setForm(f=>({...f, company: e.target.value}))} />
            <input required className="border rounded px-3 py-2" placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} />
            <input required type="email" className="border rounded px-3 py-2" placeholder="E-mail" value={form.email} onChange={e=>setForm(f=>({...f, email: e.target.value}))} />
            <input className="border rounded px-3 py-2" placeholder="Telefone" value={form.phone} onChange={e=>setForm(f=>({...f, phone: e.target.value}))} />
            <textarea className="border rounded px-3 py-2" placeholder="Mensagem" rows="4" value={form.message} onChange={e=>setForm(f=>({...f, message: e.target.value}))} />
            <button type="submit" className="btn btn-primary" disabled={status.loading}>{status.loading ? 'Enviando...' : 'Enviar'}</button>
            {status.ok && <p className="text-green-700 text-sm">Recebemos seu contato. Em breve falaremos com você.</p>}
            {status.error && <p className="text-red-700 text-sm">{status.error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
