import React, { useEffect, useMemo, useState } from 'react';
import Seo from '../components/Seo';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vehicleService, publicService } from '../services/api';
import VehicleCard from '../components/VehicleCard';
import ReservationModal from '../components/ReservationModal';
import PlanPricingCta from '../components/PlanPricingCta';
import ShareButtons from '../components/ShareButtons';
import { useAuth } from '../context/AuthContext';

export default function VehiclesPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: params.get('category') || '',
  group_id: params.get('group_id') || '',
    brand: '',
    transmission: '',
    minPrice: '',
  maxPrice: '',
  page: parseInt(params.get('page') || '1', 10),
  });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const next = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v && k !== 'page') next.set(k, v); });
  next.set('page', String(filters.page || 1));
    setParams(next, { replace: true });
  }, [filters, setParams]);

  const { data: categories } = useQuery(['vehicle-categories'], async () => {
    const res = await vehicleService.getCategories();
    return res.data?.data?.categories || res.data?.categories || [];
  });

  const { data: brands } = useQuery(['vehicle-brands'], async () => {
    const res = await vehicleService.getBrands();
    return res.data?.data?.brands || res.data?.brands || [];
  });

  // Buscar grupos públicos para nome/código do grupo selecionado
  const { data: groups } = useQuery(['public-groups'], async () => {
    const res = await publicService.getGroups();
    return res.data?.data?.groups || res.data?.groups || [];
  });

  const queryKey = useMemo(() => ['vehicles-list', filters], [filters]);
  const { data, isLoading, error, refetch } = useQuery(queryKey, async () => {
    const res = await vehicleService.getAll({
      category: filters.category || undefined,
  group_id: filters.group_id || undefined,
      brand: filters.brand || undefined,
      transmission: filters.transmission || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      limit: 12,
      page: filters.page || 1,
    });
    return res.data?.data || res.data;
  });

  const list = data?.vehicles || data?.rows || [];
  const pagination = data?.pagination;
  const selectedGroupId = filters.group_id ? parseInt(filters.group_id, 10) : null;
  const selectedGroup = (groups || []).find(g => g.id === selectedGroupId);
  const selectedGroupLabel = selectedGroup ? selectedGroup.name : (filters.group_id ? `Grupo #${filters.group_id}` : '');

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <Seo title={selectedGroup ? `Veículos do grupo ${selectedGroup.code || ''} ${selectedGroup.name || ''}`.trim() : 'Veículos disponíveis'}
           description="Encontre e filtre veículos disponíveis por categoria, grupo, marca e preço." />
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Veículos</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filtros */}
        <aside className="md:col-span-1 space-y-4">
          <div className="card p-4">
            <h2 className="font-semibold mb-3">Filtros</h2>
            {filters.group_id && (
              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-1">Grupo selecionado</div>
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full">
                  {selectedGroup?.code && <span className="font-medium">{selectedGroup.code}</span>}
                  <span>{selectedGroupLabel}</span>
                  <button
                    type="button"
                    className="text-blue-700 hover:text-blue-900"
                    onClick={() => setFilters(f => ({ ...f, group_id: '', page: 1 }))}
                    aria-label="Remover filtro de grupo"
                  >×</button>
                </div>
              </div>
            )}
            <label className="block text-sm text-gray-600 mb-1">Categoria</label>
            <select className="w-full border rounded px-2 py-2 mb-3" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
              <option value="">Todas</option>
              {(categories || []).map(c => (<option key={c} value={c}>{c}</option>))}
            </select>

            <label className="block text-sm text-gray-600 mb-1">Marca</label>
            <select className="w-full border rounded px-2 py-2 mb-3" value={filters.brand} onChange={e => setFilters(f => ({ ...f, brand: e.target.value }))}>
              <option value="">Todas</option>
              {(brands || []).map(b => (<option key={b} value={b}>{b}</option>))}
            </select>

            <label className="block text-sm text-gray-600 mb-1">Transmissão</label>
            <select className="w-full border rounded px-2 py-2 mb-3" value={filters.transmission} onChange={e => setFilters(f => ({ ...f, transmission: e.target.value }))}>
              <option value="">Todas</option>
              <option value="manual">Manual</option>
              <option value="automatic">Automática</option>
            </select>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Preço mín.</label>
                <input type="number" className="w-full border rounded px-2 py-2" value={filters.minPrice}
                  onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Preço máx.</label>
                <input type="number" className="w-full border rounded px-2 py-2" value={filters.maxPrice}
                  onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))} />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button className="btn btn-outline w-full" onClick={() => setFilters({ category: '', brand: '', transmission: '', minPrice: '', maxPrice: '', group_id: '', page: 1 })}>Limpar</button>
              <button className="btn btn-primary w-full" onClick={() => refetch()}>Aplicar</button>
            </div>
          </div>
        </aside>

        {/* Lista */}
        <section className="md:col-span-3">
          {filters.group_id && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-gray-700">Filtros ativos:</span>
              <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full">
                {selectedGroup?.code && <span className="font-medium">{selectedGroup.code}</span>}
                <span>{selectedGroupLabel}</span>
                <button
                  type="button"
                  className="text-blue-700 hover:text-blue-900"
                  onClick={() => setFilters(f => ({ ...f, group_id: '', page: 1 }))}
                  aria-label="Remover filtro de grupo"
                >×</button>
              </span>
            </div>
          )}
          {isLoading && <p className="text-gray-600">Carregando veículos...</p>}
          {error && <p className="text-primary-700">Erro ao carregar veículos.</p>}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map(v => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  onSelect={() => {
                    if (!isAuthenticated) {
                      navigate('/login');
                      return;
                    }
                    setSelected(v);
                  }}
                />
              ))}
              {list.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-600">Nenhum veículo encontrado com os filtros selecionados.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
      {/* CTA Planos e Preços */}
      <PlanPricingCta />
      {/* Compartilhamento */}
      <div className="mt-8">
        <ShareButtons text="Veja os veículos disponíveis nesta locadora!" />
      </div>
      {/* Paginação */}
      {!isLoading && !error && pagination?.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            className="btn btn-outline"
            disabled={!pagination.hasPrevPage}
            onClick={() => setFilters(f => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
          >Anterior</button>
          <span className="px-3 py-2 text-sm text-gray-700">Página {pagination.currentPage} de {pagination.totalPages}</span>
          <button
            className="btn btn-outline"
            disabled={!pagination.hasNextPage}
            onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) + 1 }))}
          >Próxima</button>
        </div>
      )}
      {selected && (
        <ReservationModal
          vehicle={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => navigate('/reservations')}
        />
      )}
    </div>
  );
}
