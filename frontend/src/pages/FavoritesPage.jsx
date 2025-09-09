import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFavorites } from '../context/FavoritesContext';
import { vehicleService } from '../services/api';
import VehicleCard from '../components/VehicleCard';

export default function FavoritesPage() {
  const { ids, clear } = useFavorites();
  const { data, isLoading } = useQuery(['vehicles-favoritos', ids], async () => {
    if (!ids.length) return { rows: [] };
    // Sem endpoint de batch: buscar todos e filtrar client-side
    const res = await vehicleService.getAll({ limit: 200 });
    const list = res.data?.data?.vehicles || res.data?.rows || [];
    return { rows: list.filter(v => ids.includes(v.id)) };
  }, { keepPreviousData: true });

  const list = useMemo(() => data?.rows || [], [data]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Favoritos</h1>
        {!!ids.length && (
          <button className="btn btn-outline" onClick={clear}>Limpar favoritos</button>
        )}
      </div>

      {isLoading && <p className="text-gray-600">Carregando...</p>}
      {!isLoading && !ids.length && (
        <p className="text-gray-600">Você ainda não favoritou nenhum veículo.</p>
      )}
      {!isLoading && ids.length > 0 && list.length === 0 && (
        <p className="text-gray-600">Nenhum dos seus favoritos está disponível no momento.</p>
      )}
      {!isLoading && list.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(v => (
            <VehicleCard key={v.id} vehicle={v} onSelect={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}
