import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { toast } from 'react-hot-toast';
import Seo from '../components/Seo';

export default function ResetPasswordPage(){
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const submit = async (e)=>{
    e.preventDefault();
    if (password !== confirm) return toast.error('Senhas não coincidem');
    try {
      await authService.resetPassword({ token, password });
      toast.success('Senha redefinida! Faça login.');
      nav('/login');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Erro ao redefinir senha');
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-md">
      <Seo title="Redefinir senha" />
      <h1 className="text-2xl font-semibold mb-4">Redefinir senha</h1>
      {!token ? <p>Token ausente.</p> : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nova senha</label>
            <input type="password" required className="w-full border rounded px-3 py-2" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Confirmar senha</label>
            <input type="password" required className="w-full border rounded px-3 py-2" value={confirm} onChange={e=>setConfirm(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit">Redefinir</button>
        </form>
      )}
    </div>
  );
}
