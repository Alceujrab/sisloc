import React from 'react';
import { Link } from 'react-router-dom';

function PlansPage(){
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Planos de Assinatura</h1>
          <p className="text-gray-600 mt-2">Escolha o plano ideal para seu perfil de uso.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[{
            name:'Essencial', price:'R$ 799/mês', features:['3 diárias/mês','Proteção básica','Suporte padrão']
          },{
            name:'Pro', price:'R$ 1.299/mês', features:['6 diárias/mês','Proteção ampliada','Suporte prioritário']
          },{
            name:'Business', price:'Sob consulta', features:['Pacotes sob medida','Faturamento mensal','Gestão de frotas']
          }].map(p => (
            <div key={p.name} className="card p-6 flex flex-col">
              <h3 className="text-xl font-semibold">{p.name}</h3>
              <div className="text-2xl font-bold text-primary-600 mt-2">{p.price}</div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {p.features.map(f => <li key={f}>• {f}</li>)}
              </ul>
              <div className="mt-6">
                <Link to="/quanto-custa" className="btn btn-primary w-full">Ver detalhes</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PlansPage;
