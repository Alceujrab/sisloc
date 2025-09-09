import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (res.success) navigate('/portal');
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Cadastrar</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-1">Nome</label>
            <input className="input w-full" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">E-mail</label>
            <input type="email" className="input w-full" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Telefone</label>
            <input className="input w-full" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Senha</label>
            <input type="password" className="input w-full" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} required />
          </div>
          <div className="md:col-span-2">
            <button className="btn btn-primary w-full" disabled={loading}>{loading? 'Criando...' : 'Criar conta'}</button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default RegisterPage;
