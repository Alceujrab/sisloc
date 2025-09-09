import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

function VehicleCard({ vehicle, onSelect }) {
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  const img = vehicle?.image_url || vehicle?.image || 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1200&auto=format&fit=crop';

  return (
    <div className="card h-full flex flex-col overflow-hidden">
      <div className="relative bg-gray-100">
        <img src={img} alt={`${vehicle.brand} ${vehicle.model}`} className="w-full h-44 object-cover" loading="lazy" />
        <button
          type="button"
          aria-label="favoritar"
          className={`absolute top-2 right-2 rounded-full px-3 py-1 text-sm ${isFavorite(vehicle.id) ? 'bg-primary-600 text-white' : 'bg-white/90 text-gray-700 border'}`}
          onClick={(e) => { e.stopPropagation(); toggle(vehicle.id); }}
        >
          {isFavorite(vehicle.id) ? '★ Favorito' : '☆ Favoritar'}
        </button>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900">{vehicle.brand} {vehicle.model}</h3>
        <p className="text-sm text-gray-500 mb-2">{vehicle.category?.toUpperCase?.() || vehicle.category}</p>
        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-bold text-primary-700">R$ {Number(vehicle.daily_rate || 0).toFixed(2)}</span>
            <span className="text-sm text-gray-500">/ diária</span>
          </div>
          <button
            className="btn btn-primary w-full"
            onClick={() => onSelect?.(vehicle)}
          >
            {isAuthenticated ? 'Reservar' : 'Fazer login para reservar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VehicleCard;
