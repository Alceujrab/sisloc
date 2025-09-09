import React, { useEffect, useState } from 'react';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Preferir estado atual se existir, depois buscar no servidor
        if (mounted && user) {
          setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
        }
        const res = await authService.getProfile();
        const fresh = res.data?.data?.user || res.data?.user || res.data;
        if (mounted && fresh) {
          setForm({ name: fresh.name || '', email: fresh.email || '', phone: fresh.phone || '' });
        }
      } catch (_) {}
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    const res = await updateProfile({ name: form.name, phone: form.phone });
    if (res?.success) setMessage('Perfil atualizado com sucesso!');
    else setMessage(res?.message || 'Não foi possível atualizar o perfil.');
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h1>
      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : (
        <div className="card p-6 space-y-4">
          <Field label="Nome">
            <input className="border rounded px-3 py-2 w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Email">
            <input className="border rounded px-3 py-2 w-full" value={form.email} disabled />
          </Field>
          <Field label="Telefone">
            <input className="border rounded px-3 py-2 w-full" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </Field>
          <div className="flex justify-end gap-2">
            <button className="btn btn-outline" onClick={() => window.history.back()}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>Salvar</button>
          </div>
          {message && <p className="text-sm text-primary-700">{message}</p>}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
