import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function ContactAdminPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(['admin-contact'], async () => {
    const res = await api.get('/admin/contact');
    return res.data.data;
  });

  const [form, setForm] = useState({ email: '', phone: '', whatsapp: '', address: '', opening_hours: '', map_embed_url: '' });

  useEffect(() => {
    if (data?.contact) setForm({
      email: data.contact.email || '',
      phone: data.contact.phone || '',
      whatsapp: data.contact.whatsapp || '',
      address: data.contact.address || '',
      opening_hours: data.contact.opening_hours || '',
      map_embed_url: data.contact.map_embed_url || ''
    });
  }, [data]);

  const save = useMutation({
    mutationFn: (payload) => api.post('/admin/contact', payload),
    onSuccess: () => { qc.invalidateQueries(['admin-contact']); toast.success('Contato salvo'); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Erro ao salvar')
  });

  if (isLoading) return <p>Carregando...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Informações de Contato</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="E-mail">
          <input className="border rounded px-2 py-1 w-full" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Telefone">
          <input className="border rounded px-2 py-1 w-full" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="WhatsApp">
          <input className="border rounded px-2 py-1 w-full" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} />
        </Field>
        <Field label="Horário de Funcionamento">
          <input className="border rounded px-2 py-1 w-full" value={form.opening_hours} onChange={e => setForm({ ...form, opening_hours: e.target.value })} />
        </Field>
        <Field label="Endereço">
          <input className="border rounded px-2 py-1 w-full" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </Field>
        <Field label="Mapa (embed URL)">
          <input className="border rounded px-2 py-1 w-full" value={form.map_embed_url} onChange={e => setForm({ ...form, map_embed_url: e.target.value })} />
        </Field>
      </div>
      <div className="flex justify-end">
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => save.mutate(form)}>Salvar</button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="text-sm">
      <div className="mb-1 text-gray-600">{label}</div>
      {children}
    </label>
  );
}
