import React, { useState } from 'react';
import { authService } from '../services/api';
import { toast } from 'react-hot-toast';
import Seo from '../components/Seo';

export default function ForgotPasswordPage(){
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const submit = async (e)=>{
    e.preventDefault();
    try {
      await authService.forgotPassword({ email });
      setSent(true);
      toast.success('Se o email existir, enviaremos instruções.');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Erro ao enviar instruções');
    }
  };
  return (
    <div className="container mx-auto px-4 py-10 max-w-md">
      <Seo title="Esqueci minha senha" description="Recupere o acesso à sua conta" />
      <h1 className="text-2xl font-semibold mb-4">Esqueci minha senha</h1>
      {sent ? (
        <p>Se o email existir, você receberá um link para redefinir a senha.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input type="email" required className="w-full border rounded px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit">Enviar instruções</button>
        </form>
      )}
    </div>
  );
}
