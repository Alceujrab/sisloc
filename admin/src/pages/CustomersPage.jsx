import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { adminService } from '../services/api';

function CustomersPage() {
  const { data, isLoading, error } = useQuery(['admin-customers'], async () => {
    const res = await api.get('/admin/customers?limit=20');
    return res.data.data;
  });

  if (isLoading) return <p>Carregando...</p>;
  if (error) return <p>Erro ao carregar clientes</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Clientes</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-50">
            <tr>
              <Th>Foto</Th>
              <Th>Nome</Th>
              <Th>Email</Th>
              <Th>Telefone</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {data.customers.map(c => (
              <CustomerRow key={c.id} c={c} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }) {
  return <th className="text-left p-2 border-b">{children}</th>;
}

function Td({ children }) {
  return <td className="p-2">{children}</td>;
}

export default CustomersPage;

function CustomerRow({ c }){
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const onPick = ()=> fileRef.current?.click();
  const onFile = async(e) => {
    const f = e.target.files?.[0];
    if(!f) return;
    setBusy(true);
    try {
      await adminService.uploadCustomerAvatar(c.id, f);
      // força atualização simples recarregando a lista
      window.location.reload();
    } finally { setBusy(false); }
  };

  return (
    <tr className="border-t">
      <Td>
        <div className="flex items-center gap-2">
          <img src={c.avatar || 'https://via.placeholder.com/48x48?text=%20'} alt={c.name} className="w-12 h-12 rounded object-cover border" />
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
        </div>
      </Td>
  <Td><Link to={`/customers/${c.id}`} className="text-blue-600 hover:underline">{c.name}</Link></Td>
      <Td>{c.email}</Td>
      <Td>{c.phone || '-'}</Td>
      <Td>{c.status}</Td>
      <Td>
        <button disabled={busy} onClick={onPick} className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">{busy ? 'Enviando…' : 'Anexar/Tirar foto'}</button>
      </Td>
    </tr>
  );
}
