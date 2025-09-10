import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/api';

function TextInput({ label, type = 'text', value, onChange, rightSlot, ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm text-gray-700">{label}</label>}
      <div className="relative">
        <input
          className="w-full border rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          type={type}
          value={value}
          onChange={onChange}
          {...props}
        />
        {rightSlot && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500">
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
  setInfo('');
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
      const apiMsg = err.response?.data?.error || err.response?.data?.message;
      setError(apiMsg || 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    try {
      setError('');
      setInfo('');
      if (!email) {
        setError('Informe seu email para recuperar a senha.');
        return;
      }
      await adminService.forgotPassword(email);
      setInfo('Se o email existir, enviaremos instruções de recuperação.');
    } catch (e) {
      setError('Não foi possível solicitar recuperação agora.');
    }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    try {
      setError('');
      setInfo('');
      if (!inviteToken) {
        setError('Informe o código de convite para criar um administrador. Solicite ao admin atual.');
        return;
      }
      // o backend usa o email contido no token; campo de email fica apenas informativo
      const r = await adminService.registerAdminWithInvite({ inviteToken, name: regName, password: regPassword });
      if (r.data?.success) {
        setInfo('Administrador criado. Faça login com seu email e senha.');
        setShowRegister(false);
      } else {
        setError(r.data?.message || 'Não foi possível criar a conta.');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Falha ao criar conta');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white shadow-sm border rounded-lg p-6 space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Acesso ao Painel</h1>
          <p className="text-sm text-gray-500">Entre com suas credenciais administrativas.</p>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
        {info && <div className="text-green-600 text-sm">{info}</div>}

        <form onSubmit={onSubmit} className="space-y-4">
          <TextInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <TextInput
            label="Senha"
            type={showPwd ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            rightSlot={
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="text-blue-600 hover:underline">
                {showPwd ? 'Ocultar' : 'Mostrar'}
              </button>
            }
          />
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={onForgot} className="text-blue-600 hover:underline">Esqueci minha senha</button>
            <button type="button" onClick={() => setShowRegister(true)} className="text-blue-600 hover:underline">Criar conta admin</button>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 transition text-white rounded py-2">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {showRegister && (
          <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Criar Administrador</h2>
                <button onClick={() => setShowRegister(false)} className="text-sm text-gray-500 hover:underline">Fechar</button>
              </div>
              <form onSubmit={onRegister} className="space-y-3">
                <TextInput label="Nome" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                <TextInput label="Email (informativo do convite)" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="email do convite" />
                <TextInput label="Senha" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                <TextInput label="Código de Convite" value={inviteToken} onChange={(e) => setInviteToken(e.target.value)} required placeholder="cole aqui o token recebido" />
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setShowRegister(false)} className="px-4 py-2 border rounded">Cancelar</button>
                  <button type="submit" disabled={regLoading} className="px-4 py-2 bg-blue-600 text-white rounded">
                    {regLoading ? 'Criando...' : 'Criar conta'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Para segurança, somente quem receber um convite de um administrador atual consegue criar uma nova conta admin.</p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
