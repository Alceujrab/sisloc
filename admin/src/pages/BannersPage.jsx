import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export default function BannersPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data, isLoading, error } = useQuery(['admin-banners'], async () => {
    const res = await api.get('/admin/banners');
    return res.data.data;
  });

  const create = useMutation({
    mutationFn: (payload) => api.post('/admin/banners', payload),
    onSuccess: () => { qc.invalidateQueries(['admin-banners']); toast.success('Banner criado'); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Erro ao criar')
  });

  const update = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/admin/banners/${id}`, payload),
    onSuccess: () => { qc.invalidateQueries(['admin-banners']); toast.success('Banner atualizado'); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Erro ao atualizar')
  });

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/admin/banners/${id}`),
    onSuccess: () => { qc.invalidateQueries(['admin-banners']); toast.success('Banner excluído'); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Erro ao excluir')
  });

  if (isLoading) return <p>Carregando...</p>;
  if (error) return <p className="text-blue-700">Erro ao carregar banners</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Banners</h2>
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => { setEditing(null); setModalOpen(true); }}>Novo Banner</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.banners.map(b => (
          <div key={b.id} className="border rounded p-3 space-y-2">
            <img src={b.image_url} alt={b.title} className="w-full h-32 object-cover rounded" />
            <div>
              <div className="font-semibold">{b.title}</div>
              {b.subtitle && <div className="text-sm text-gray-600">{b.subtitle}</div>}
              <div className="text-xs text-gray-500">Posição: {b.position} • {b.is_active ? 'Ativo' : 'Inativo'}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-2 py-1 border rounded text-sm" onClick={() => { setEditing(b); setModalOpen(true); }}>Editar</button>
              <button className="px-2 py-1 border rounded text-sm" onClick={() => { if (confirm('Excluir banner?')) remove.mutate(b.id); }}>Excluir</button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <BannerModal
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={async (values) => {
            if (editing) await update.mutateAsync({ id: editing.id, payload: values });
            else await create.mutateAsync(values);
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function BannerModal({ initial, onClose, onSubmit }) {
  const [form, setForm] = useState(() => initial || { title: '', subtitle: '', image_url: '', link_url: '', position: 0, is_active: true });
  const [errors, setErrors] = useState({});
  const validate = () => {
    const e = {};
    if (!form.title) e.title = 'Informe o título';
    if (!form.image_url) e.image_url = 'Informe a URL da imagem';
    setErrors(e); return Object.keys(e).length === 0;
  };
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
      <div className="bg-white w-full max-w-lg rounded shadow p-6 space-y-4">
        <h3 className="text-xl font-semibold">{initial ? 'Editar' : 'Novo'} Banner</h3>
        <div className="grid grid-cols-1 gap-3">
          <Field label="Título" error={errors.title}>
            <input className="border rounded px-2 py-1 w-full" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Subtítulo">
            <input className="border rounded px-2 py-1 w-full" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} />
          </Field>
          <Field label="Imagem URL" error={errors.image_url}>
            <input className="border rounded px-2 py-1 w-full" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
          </Field>
          <Field label="Link URL">
            <input className="border rounded px-2 py-1 w-full" value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} />
          </Field>
          <Field label="Posição">
            <input type="number" className="border rounded px-2 py-1 w-full" value={form.position} onChange={e => setForm({ ...form, position: Number(e.target.value) })} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Ativo
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-2 border rounded" onClick={onClose}>Cancelar</button>
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => validate() ? onSubmit(form) : null}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="text-sm">
      <div className="mb-1 text-gray-600">{label}</div>
      {children}
      {error && <div className="text-xs text-blue-700 mt-1">{error}</div>}
    </label>
  );
}
