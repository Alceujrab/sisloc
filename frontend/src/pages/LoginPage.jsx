import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(form);
    setLoading(false);
    if (res.success) navigate('/portal');
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Acesse sua conta</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              className="input w-full"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                className="input w-full pr-10"
                placeholder="********"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                {show ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="text-center mt-6">
          <div className="text-gray-500 text-sm mb-2">OU</div>
          <Link to="/register" className="btn btn-outline w-full">Criar conta</Link>
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
