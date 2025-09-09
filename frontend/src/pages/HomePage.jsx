import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Star, 
  Users, 
  Shield, 
  Clock,
  CheckCircle,
  TrendingUp,
  Award,
  Heart,
  ArrowRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { vehicleService, formatters, publicService } from '../services/api';
import { motion } from 'framer-motion';
import VehicleCategoryCarousel from '../components/VehicleCategoryCarousel';

function HomePage() {
  const [searchData, setSearchData] = useState({
    pickup_location: '',
    start_date: '',
    end_date: '',
    category: ''
  });

  // Buscar veículos em destaque
  const { data: featuredVehicles, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featuredVehicles'],
    queryFn: () => vehicleService.getFeatured(6),
    select: (response) => response.data.data.vehicles
  });

  // Buscar categorias
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => vehicleService.getCategories(),
    select: (response) => response.data.data.categories
  });

  // Banners públicos
  const { data: banners } = useQuery({
    queryKey: ['public-banners'],
    queryFn: () => publicService.getBanners(),
    select: (res) => res.data?.data?.banners || []
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    Object.entries(searchData).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });
    
    window.location.href = `/vehicles?${params.toString()}`;
  };

  const benefits = [
    {
      icon: Shield,
      title: 'Seguro Completo',
      description: 'Proteção total para sua tranquilidade'
    },
    {
      icon: Clock,
      title: '24/7 Suporte',
      description: 'Atendimento disponível a qualquer hora'
    },
    {
      icon: CheckCircle,
      title: 'Sem Taxas Ocultas',
      description: 'Preços transparentes e justos'
    },
    {
      icon: Award,
      title: 'Qualidade Garantida',
      description: 'Veículos novos e bem cuidados'
    }
  ];

  const stats = [
    { number: '10k+', label: 'Clientes Satisfeitos' },
    { number: '500+', label: 'Veículos Disponíveis' },
    { number: '50+', label: 'Cidades Atendidas' },
    { number: '99%', label: 'Satisfação do Cliente' }
  ];

  return (
    <>
      <Seo title="Locadora de Veículos" description="Locação de veículos com as melhores condições. Carros novos, seguros e preços competitivos. Reserve agora!" />

  {/* Hero Section com banners (se existirem) */}
  <section className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-blue-600 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Alugue o carro
                <span className="text-primary-300"> perfeito</span> para sua viagem
              </h1>
              <p className="mt-6 text-xl text-blue-100 max-w-lg">
                Frota moderna, preços justos e atendimento excepcional. 
                Sua aventura começa aqui!
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/vehicles"
                  className="btn btn-primary btn-lg inline-flex items-center"
                >
                  Ver Veículos
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/groups"
                  className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-blue-900"
                >
                  Ver Grupos
                </Link>
                <Link
                  to="/about"
                  className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-blue-900"
                >
                  Saiba Mais
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Reserve Agora
                </h3>
                
                <form onSubmit={handleSearch} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Local de Retirada
                    </label>
                    <input
                      type="text"
                      placeholder="Onde você quer retirar?"
                      className="input w-full"
                      value={searchData.pickup_location}
                      onChange={(e) => setSearchData({...searchData, pickup_location: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Retirada
                      </label>
                      <input
                        type="date"
                        className="input w-full"
                        value={searchData.start_date}
                        onChange={(e) => setSearchData({...searchData, start_date: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Devolução
                      </label>
                      <input
                        type="date"
                        className="input w-full"
                        value={searchData.end_date}
                        onChange={(e) => setSearchData({...searchData, end_date: e.target.value})}
                        min={searchData.start_date || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    <select
                      className="input w-full"
                      value={searchData.category}
                      onChange={(e) => setSearchData({...searchData, category: e.target.value})}
                    >
                      <option value="">Todas as categorias</option>
                      <option value="compact">Compacto</option>
                      <option value="sedan">Sedan</option>
                      <option value="suv">SUV</option>
                      <option value="luxury">Luxo</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-full"
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Buscar Veículos
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
          {/* Banners thumbnails simples */}
          {banners && banners.length > 0 && (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {banners.slice(0,3).map((b) => (
                <a key={b.id} href={b.link_url || '#'} className="block group">
                  <div className="relative overflow-hidden rounded-xl ring-1 ring-white/10">
                    <img src={b.image_url} alt={b.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute inset-0 p-4 flex flex-col justify-end">
                      <h4 className="text-white font-semibold text-lg drop-shadow">{b.title}</h4>
                      {b.subtitle && <p className="text-blue-100 text-sm">{b.subtitle}</p>}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

  {/* Carrossel de Categorias */}
  <VehicleCategoryCarousel />

      {/* Planos e Preços Destaque */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
              <h3 className="text-2xl font-bold">Planos de Assinatura</h3>
              <p className="mt-2 text-blue-100">Economize com diárias inclusas e benefícios exclusivos.</p>
              <div className="mt-6">
                <Link to="/plans" className="btn bg-white text-blue-700 hover:bg-blue-50">Ver Planos</Link>
              </div>
            </div>
            <div className="card p-6 border">
              <h3 className="text-2xl font-bold text-gray-900">Quanto Custa</h3>
              <p className="mt-2 text-gray-600">Veja tarifas a partir de cada grupo e entenda as proteções.</p>
              <div className="mt-6">
                <Link to="/quanto-custa" className="btn btn-primary">Ver Preços</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Veículos em Destaque */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Veículos em Destaque
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Conheça alguns dos nossos veículos mais populares, 
              escolhidos pelos nossos clientes
            </p>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="bg-gray-300 rounded-lg h-48 mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3 mb-4"></div>
                  <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredVehicles?.map((vehicle, index) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card group hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={vehicle.thumbnail || '/api/placeholder/400/250'}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4">
                      <button className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 hover:text-primary-600 transition-colors">
                        <Heart className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                        {vehicle.category}
                      </span>
                    </div>
                    
                    <div className="flex items-center mb-3">
                      <div className="flex items-center text-primary-300 mr-2">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">4.8</span>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Users className="h-4 w-4 mr-1" />
                        {vehicle.seats} lugares
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-primary-600">
                          {formatters.currency(vehicle.daily_rate)}
                        </span>
                        <span className="text-gray-500 text-sm">/dia</span>
                      </div>
                      <Link
                        to={`/vehicles/${vehicle.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        Ver Detalhes
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/vehicles"
              className="btn btn-outline btn-lg"
            >
              Ver Todos os Veículos
            </Link>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que escolher nossa locadora?
            </h2>
            <p className="text-lg text-gray-600">
              Oferecemos a melhor experiência em locação de veículos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center group"
                >
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">
                    {benefit.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pronto para sua próxima aventura?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Reserve agora e ganhe desconto especial na sua primeira locação
            </p>
            <Link
              to="/vehicles"
              className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100 font-bold px-8"
            >
              Reservar Agora
            </Link>
            <Link
              to="/groups"
              className="btn btn-lg ml-4 bg-white/10 text-white hover:bg-white/20 font-bold px-8 border border-white/40"
            >
              Ver Grupos
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}

export default HomePage;
