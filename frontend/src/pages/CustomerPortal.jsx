import React from 'react';
import { Link } from 'react-router-dom';
import { User, Car, History, Receipt, Gift, CreditCard, Tag } from 'lucide-react';

const cards = [
  { icon: User, title: 'Minha Conta', desc: 'Altere o cadastro, senha e cartões cadastrados', to: '/portal/account' },
  { icon: Car, title: 'Minhas Reservas', desc: 'Confira todas as reservas realizadas', to: '/reservations' },
  { icon: History, title: 'Histórico', desc: 'Consulte seu histórico de contratos e reservas', to: '/portal/history' },
  { icon: Receipt, title: 'Reembolso', desc: 'Solicite reembolsos e acompanhe os status', to: '/portal/refunds' },
  { icon: Gift, title: 'Fidelidade', desc: 'Confira seu extrato de pontos e benefícios', to: '/portal/loyalty' },
  { icon: Tag, title: 'Assinatura', desc: 'Planos mensais para você ou sua empresa', to: '/assinatura' },
  { icon: Tag, title: 'Planos e Preços', desc: 'Conheça nossos planos e valores', to: '/quanto-custa' },
  { icon: CreditCard, title: 'Meus Pagamentos', desc: 'Consulte os pagamentos e débitos pendentes', to: '/payments' }
];

function CustomerPortal(){
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold mb-6">Portal do Cliente</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(({icon:Icon,title,desc,to}) => (
            <div key={title} className="card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="h-6 w-6 text-primary-600"/>
                  <h3 className="font-semibold text-lg">{title}</h3>
                </div>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
              <div className="mt-4">
                <Link to={to} className="btn btn-outline">Acessar</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CustomerPortal;
