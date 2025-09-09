import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicService } from '../../services/api';
import { Link } from 'react-router-dom';
import { 
  Car, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin 
} from 'lucide-react';

function Footer() {
  const { data: contact } = useQuery({
    queryKey: ['public-contact-footer'],
    queryFn: () => publicService.getContactInfo().then(res => res.data?.data?.contact || null)
  });
  const currentYear = new Date().getFullYear();

  const companyLinks = [
    { to: '/about', label: 'Sobre Nós' },
    { to: '/como-funciona', label: 'Como Funciona' },
    { to: '/contact', label: 'Contato' },
    { to: '/news', label: 'Notícias' },
    { to: '/empresas', label: 'Para Empresas' },
  ];

  const serviceLinks = [
    { to: '/vehicles', label: 'Nossos Veículos' },
    { to: '/groups', label: 'Grupos de Carros' },
    { to: '/assinatura', label: 'Assinatura' },
    { to: '/aluguel-mensal', label: 'Aluguel Mensal' },
    { to: '/protecoes', label: 'Proteções' },
    { to: '/offers', label: 'Ofertas & Cupons' },
    { to: '/locations', label: 'Localizações' },
  ];

  const supportLinks = [
    { to: '/quanto-custa', label: 'Quanto Custa' },
    { to: '/faq', label: 'FAQ' },
    { to: '/terms', label: 'Termos de Uso' },
    { to: '/privacy', label: 'Política de Privacidade' },
    { to: '/cancelamento', label: 'Política de Cancelamento' },
  ];

  const socialLinks = [
    { href: 'https://facebook.com', icon: Facebook, label: 'Facebook' },
    { href: 'https://instagram.com', icon: Instagram, label: 'Instagram' },
    { href: 'https://twitter.com', icon: Twitter, label: 'Twitter' },
    { href: 'https://linkedin.com', icon: Linkedin, label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <Car className="h-8 w-8 text-primary-500" />
              <span className="ml-2 text-xl font-bold">Locadora</span>
            </div>
            <p className="text-gray-300 mb-6 text-sm leading-6">
              A melhor experiência em locação de veículos. 
              Carros novos, seguros e preços justos para sua viagem.
            </p>
            
            {/* Informações de Contato */}
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-300">
                <Phone className="h-4 w-4 mr-2 text-primary-500" />
                <span>{contact?.phone || '(11) 9999-9999'}</span>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <Mail className="h-4 w-4 mr-2 text-primary-500" />
                <span>{contact?.email || 'contato@locadora.com'}</span>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <MapPin className="h-4 w-4 mr-2 text-primary-500" />
                {contact?.map_url ? (
                  <a href={contact.map_url} target="_blank" rel="noreferrer" className="underline hover:text-primary-300">{contact?.address || 'Ver no mapa'}</a>
                ) : (
                  <span>{contact?.address || 'São Paulo, SP - Brasil'}</span>
                )}
              </div>
              {contact?.whatsapp && (
                <div className="flex items-center text-sm text-gray-300">
                  <span className="ml-6">WhatsApp: {contact.whatsapp}</span>
                </div>
              )}
            </div>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-gray-300 hover:text-primary-400 text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Serviços */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Serviços</h3>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-gray-300 hover:text-primary-400 text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Suporte</h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-gray-300 hover:text-primary-400 text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Receba nossas ofertas especiais
              </h3>
              <p className="text-gray-300 text-sm">
                Inscreva-se em nossa newsletter e fique por dentro das melhores promoções.
              </p>
            </div>
            <div className="flex max-w-md">
              <input
                type="email"
                placeholder="Seu e-mail"
                className="flex-1 px-4 py-2 bg-gray-800 text-white border border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button className="px-6 py-2 bg-primary-600 text-white font-medium rounded-r-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200">
                Inscrever
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-8 pt-8 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-400">
            <p>&copy; {currentYear} Locadora. Todos os direitos reservados.</p>
          </div>

          {/* Redes Sociais */}
          <div className="flex space-x-4 mt-4 sm:mt-0">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary-400 transition-colors duration-200"
                  aria-label={social.label}
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
