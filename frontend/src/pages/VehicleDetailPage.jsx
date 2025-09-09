import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { vehicleService } from '../services/api';
import { formatters } from '../services/api';

function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dates, setDates] = useState({
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || ''
  });
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await vehicleService.getById(id);
        if (!active) return;
        setVehicle(data.data.vehicle);
      } catch (e) {
        setError('Não foi possível carregar o veículo');
      } finally {
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const checkAvail = async () => {
    try {
      const { data } = await vehicleService.checkAvailability(id, dates);
      setAvailability(data.data);
    } catch (e) {
      setAvailability(null);
    }
  };

  const handleReserve = () => {
    navigate('/reservations');
  };

  if (loading) return <div className="container mx-auto p-4">Carregando…</div>;
  if (error) return <div className="container mx-auto p-4 text-red-600">{error}</div>;
  if (!vehicle) return null;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/">Início</Link> / <Link to="/vehicles">Veículos</Link> / <span>{vehicle.brand} {vehicle.model}</span>
      </nav>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {vehicle.images && vehicle.images.length > 0 ? (
            <img src={vehicle.images[0]} alt={vehicle.model} className="w-full h-64 object-cover rounded" />
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded" />
          )}
          <div className="grid grid-cols-4 gap-2 mt-2">
            {(vehicle.images || []).slice(1, 5).map((img, idx) => (
              <img key={idx} src={img} alt={vehicle.model + idx} className="w-full h-20 object-cover rounded" />
            ))}
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{vehicle.brand} {vehicle.model} {vehicle.year}</h1>
          <p className="text-gray-600">Categoria: {vehicle.category?.toUpperCase()}</p>
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="text-lg font-bold">{formatters.currency(vehicle.daily_rate)} / dia</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-700">
              <div>Transmissão: {vehicle.transmission}</div>
              <div>Combustível: {vehicle.fuel_type}</div>
              <div>Portas: {vehicle.doors}</div>
              <div>Assentos: {vehicle.seats}</div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium">Início</label>
            <input type="date" value={dates.start_date} onChange={e=>setDates(d=>({...d, start_date:e.target.value}))} className="input input-bordered w-full" />
            <label className="block text-sm font-medium mt-2">Fim</label>
            <input type="date" value={dates.end_date} onChange={e=>setDates(d=>({...d, end_date:e.target.value}))} className="input input-bordered w-full" />
            <div className="flex gap-2 mt-3">
              <button onClick={checkAvail} className="btn btn-outline">Checar disponibilidade</button>
              <button onClick={handleReserve} className="btn btn-primary">Reservar</button>
            </div>
            {availability && (
              <div className="mt-3 text-sm">
                {availability.available ? (
                  <div className="text-green-600">Disponível por {availability.days} dias. Subtotal: {formatters.currency(availability.pricing.subtotal)}</div>
                ) : (
                  <div className="text-red-600">Indisponível nas datas selecionadas.</div>
                )}
              </div>
            )}
          </div>

          {vehicle.description && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-1">Descrição</h2>
              <p className="text-gray-700 text-sm leading-6">{vehicle.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VehicleDetailPage;
