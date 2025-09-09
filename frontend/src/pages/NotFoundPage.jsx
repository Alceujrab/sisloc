import React from 'react';
import Seo from '../components/Seo';

export default function NotFoundPage(){
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <Seo title="Página não encontrada" />
      <h1 className="text-3xl font-bold mb-2">404</h1>
      <p className="text-gray-600">A página que você procura não foi encontrada.</p>
    </div>
  );
}
