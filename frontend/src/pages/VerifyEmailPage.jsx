import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authService } from '../services/api';
import Seo from '../components/Seo';

export default function VerifyEmailPage(){
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('');

  useEffect(()=>{
    if(!token){ setStatus('error'); setMessage('Token ausente'); return; }
    (async()=>{
      try {
        const { data } = await authService.verifyEmail(token);
        setStatus('ok'); setMessage(data?.message || 'Email verificado!');
      } catch (e) {
        setStatus('error'); setMessage(e?.response?.data?.message || 'Não foi possível verificar');
      }
    })();
  },[token]);

  return (
    <div className="container mx-auto px-4 py-10 max-w-lg">
      <Seo title="Verificar e-mail" />
      <h1 className="text-2xl font-semibold mb-4">Verificar e-mail</h1>
      <p className={status==='ok' ? 'text-green-700' : 'text-red-700'}>{message}</p>
    </div>
  );
}
