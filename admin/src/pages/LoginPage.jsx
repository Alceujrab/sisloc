import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/api';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminService.login({ email, password });
      const success = res.data?.success;
      const token = res.data?.data?.token;
      const user = res.data?.data?.user;

      if (!success || !token) {
        setError('Resposta inválida do servidor');
        return;
      }

      if (user && !['admin', 'employee'].includes(user.role)) {
        setError('Usuário sem permissão para o painel admin');
        return;
      }

      localStorage.setItem('token', token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm border rounded p-6 space-y-4">
        <h1 className="text-xl font-bold">Login - Admin</h1>
        {error && <div className="text-primary-600 text-sm">{error}</div>}
        <div className="space-y-1">
          <label className="block text-sm">Email</label>
          <input className="w-full border rounded px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="block text-sm">Senha</label>
          <input className="w-full border rounded px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white rounded py-2">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
