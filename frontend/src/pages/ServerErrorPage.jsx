import React from 'react';
import { Link } from 'react-router-dom';

export default function ServerErrorPage() {
  return (
    <div className="max-w-2xl mx-auto p-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Ops, algo deu errado.</h1>
      <p className="text-gray-600 mb-6">Ocorreu um erro inesperado (500). Tente novamente mais tarde.</p>
      <div className="space-x-2">
        <Link className="btn btn-primary" to="/">Voltar para a página inicial</Link>
        <button className="btn btn-outline" onClick={()=>window.location.reload()}>Recarregar</button>
      </div>
    </div>
  );
}
