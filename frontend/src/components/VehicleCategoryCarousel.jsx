import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, A11y, EffectCreative } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Carrossel de categorias usando Swiper.js com transições suaves
function VehicleCategoryCarousel({ items }) {
  const categories = items || [
    {
      key: 'sedan',
      title: 'Grupo L - Executivo Automático',
      name: 'Sedan',
      description:
        'Veículo similar a: Toyota Corolla, Honda Civic, Nissan Sentra 2.0, dentre outros.',
      image:
        'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1600&auto=format&fit=crop',
    },
    {
      key: 'suv',
      title: 'Grupo GY - SUV Híbrido',
      name: 'SUV',
      description:
        'Veículo similar a: GWM Haval H6, Toyota Corolla Cross, Jeep Compass, dentre outros.',
      image:
        'https://images.unsplash.com/photo-1605559424843-9e4c228bf1f3?q=80&w=1600&auto=format&fit=crop',
    },
    {
      key: 'pickup',
      title: 'Grupo PK - Pick-up 4x4',
      name: 'Pick-up',
      description:
        'Veículo similar a: Toyota Hilux, Chevrolet S10, Ford Ranger, dentre outros.',
      image:
        'https://images.unsplash.com/photo-1614200187524-a0a0a1e6f3b1?q=80&w=1600&auto=format&fit=crop',
    },
    {
      key: 'hatch',
      title: 'Grupo H - Hatch Econômico',
      name: 'Hatch',
      description:
        'Veículo similar a: Chevrolet Onix, Hyundai HB20, Fiat Argo, dentre outros.',
      image:
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1600&auto=format&fit=crop',
    },
    {
      key: 'utilitario',
      title: 'Grupo U - Utilitário',
      name: 'Utilitário',
      description:
        'Veículo similar a: Fiat Fiorino, Renault Kangoo, Fiat Ducato, dentre outros.',
      image:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1600&auto=format&fit=crop',
    },
  ];

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Conheça a nossa Frota
          </h2>
          <p className="text-gray-600">
            As melhores condições para você reservar e aproveitar
          </p>
        </div>

        <div className="relative">
          {/* Botões customizados (ligados por CSS selectors) */}
          <button
            className="cat-prev hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white shadow border text-gray-700 hover:bg-gray-50"
            aria-label="Anterior"
            type="button"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <Swiper
            modules={[Navigation, Pagination, Autoplay, A11y, EffectCreative]}
            navigation={{ prevEl: '.cat-prev', nextEl: '.cat-next' }}
            pagination={{ clickable: true, dynamicBullets: true }}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            speed={650}
            grabCursor
            spaceBetween={16}
            breakpoints={{
              0: { slidesPerView: 1.05 },
              640: { slidesPerView: 1.6 },
              768: { slidesPerView: 2.2 },
              1024: { slidesPerView: 3.1 },
            }}
            className="pb-10"
          >
            {categories.map((item) => (
              <SwiperSlide key={item.key}>
                <div className="card overflow-hidden group h-full">
                  <div className="relative bg-gray-50">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-center text-lg font-bold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-center text-primary-700 font-medium text-sm mb-2">
                      {item.name}
                    </p>
                    <p className="text-center text-gray-600 text-sm mb-4 min-h-[42px]">
                      {item.description}
                    </p>
                    <div className="text-center">
                      <Link
                        to={`/vehicles?category=${item.key}`}
                        className="btn btn-primary btn-sm"
                      >
                        Ver ofertas
                      </Link>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <button
            className="cat-next hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white shadow border text-gray-700 hover:bg-gray-50"
            aria-label="Próximo"
            type="button"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center mt-10">
          <Link to="/vehicles" className="btn btn-outline btn-lg">
            Confira todos os grupos
          </Link>
        </div>
      </div>
    </section>
  );
}

export default VehicleCategoryCarousel;
