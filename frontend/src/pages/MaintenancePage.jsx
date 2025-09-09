import React from 'react';
import Seo from '../components/Seo';

export default function MaintenancePage(){
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <Seo title="Em manutenção" />
      <h1 className="text-2xl font-semibold mb-2">Voltamos já!</h1>
      <p className="text-gray-600">Estamos fazendo uma manutenção rápida.</p>
    </div>
  );
}
