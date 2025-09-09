import React from 'react';
import Seo from '../components/Seo';

export default function NewsPage(){
  const posts = [
    { title: 'Nova frota 2025', excerpt: 'Chegaram novos modelos com mais tecnologia e segurança.', date: '2025-07-01' },
    { title: 'Parceria corporativa', excerpt: 'Condições especiais para empresas com faturamento mensal.', date: '2025-06-15' },
  ];
  return (
    <div>
      <Seo title="Notícias" description="Novidades e comunicados" />
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold">Notícias</h1>
          <p className="mt-2 text-blue-100">Fique por dentro das novidades.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid sm:grid-cols-2 gap-6">
        {posts.map((p) => (
          <article key={p.title} className="border rounded p-5 bg-white">
            <div className="text-xs text-gray-500">{new Date(p.date).toLocaleDateString('pt-BR')}</div>
            <h2 className="text-lg font-semibold mt-1">{p.title}</h2>
            <p className="text-gray-700 mt-2">{p.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
