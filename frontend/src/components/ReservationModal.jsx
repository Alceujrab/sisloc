import React, { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { reservationService, vehicleService, publicService, formatters } from '../services/api';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  startDate: z.string().min(1, 'Informe a data/hora de início'),
  endDate: z.string().min(1, 'Informe a data/hora de término'),
  coupon: z.string().optional()
}).refine((data) => {
  if (!data.startDate || !data.endDate) return true;
  return new Date(data.endDate) > new Date(data.startDate);
}, { path: ['endDate'], message: 'Término deve ser após o início' });

export default function ReservationModal({ vehicle, onClose, onSuccess }) {
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { startDate: '', endDate: '', coupon: '' }
  });
  const [includeInsurance, setIncludeInsurance] = React.useState(false);
  const [extras, setExtras] = React.useState({ gps: false, child_seat: false, additional_driver: false });
  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const [couponInfo, setCouponInfo] = React.useState(null);
  const canCheck = Boolean(startDate && endDate);

  const { data: avail, refetch: refetchAvail, isFetching: checking } = useQuery(
    ['availability', vehicle?.id, startDate, endDate],
    async () => {
      if (!vehicle?.id || !startDate || !endDate) return null;
      const res = await vehicleService.checkAvailability(vehicle.id, {
        startDate,
        endDate,
      });
      return res.data?.data || res.data;
    },
    { enabled: canCheck }
  );

  const createMutation = useMutation({
    mutationFn: (payload) => reservationService.create(payload),
    onSuccess: () => {
      toast.success('Reserva criada com sucesso!');
      onSuccess?.();
      onClose?.();
    },
    onError: (e) => {
      const msg = e?.response?.data?.message || 'Não foi possível criar a reserva';
      toast.error(msg);
    }
  });

  const onSubmit = (form) => {
    createMutation.mutate({
      vehicle_id: vehicle.id,
      start_date: form.startDate,
      end_date: form.endDate,
      pickup_location: 'Matriz',
      return_location: 'Matriz',
      coupon_code: form.coupon || undefined,
  include_insurance: includeInsurance,
  extras: Object.entries(extras).filter(([k,v])=>v).map(([k])=>k)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Reservar {vehicle.brand} {vehicle.model}</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Início</label>
            <input type="datetime-local" className="w-full border rounded px-3 py-2" {...register('startDate')} />
            {errors.startDate && <p className="text-sm text-primary-700 mt-1">{errors.startDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Fim</label>
            <input type="datetime-local" className="w-full border rounded px-3 py-2" {...register('endDate')} />
            {errors.endDate && <p className="text-sm text-primary-700 mt-1">{errors.endDate.message}</p>}
          </div>

          <div className="text-sm">
            <p className="text-gray-600">Diária: <span className="font-medium text-gray-900">{formatters.currency(vehicle.daily_rate || 0)}</span></p>
            {vehicle?.insurance_daily !== undefined && (
              <div className="mt-2">
                <label className="inline-flex items-center gap-2 text-gray-700">
                  <input type="checkbox" checked={includeInsurance} onChange={(e)=>setIncludeInsurance(e.target.checked)} />
                  Incluir seguro ({formatters.currency(vehicle.insurance_daily || 0)}/dia)
                </label>
              </div>
            )}
            <div className="mt-2 text-gray-700">
              <div className="font-medium">Extras</div>
              <label className="block"><input type="checkbox" className="mr-2" checked={extras.gps} onChange={e=>setExtras(s=>({...s, gps: e.target.checked}))} />GPS (+{formatters.currency(15)}/dia)</label>
              <label className="block"><input type="checkbox" className="mr-2" checked={extras.child_seat} onChange={e=>setExtras(s=>({...s, child_seat: e.target.checked}))} />Cadeira infantil (+{formatters.currency(20)}/dia)</label>
              <label className="block"><input type="checkbox" className="mr-2" checked={extras.additional_driver} onChange={e=>setExtras(s=>({...s, additional_driver: e.target.checked}))} />Condutor adicional (+{formatters.currency(25)}/dia)</label>
            </div>
            {checking && <p className="text-gray-500 mt-1">Verificando disponibilidade...</p>}
            {avail && (
              <p className={avail.available ? 'text-green-600 mt-1' : 'text-primary-700 mt-1'}>
                {avail.available ? 'Disponível para as datas selecionadas.' : 'Indisponível para as datas selecionadas.'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Cupom de desconto</label>
            <div className="flex gap-2">
              <input className="flex-1 border rounded px-3 py-2" {...register('coupon')} onChange={e=>{ setValue('coupon', e.target.value); setCouponInfo(null); }} placeholder="INSIRA SEU CUPOM" />
              <button type="button" className="btn btn-outline" onClick={async()=>{
                const coupon = (watch('coupon') || '').trim();
                if (!coupon) return;
                try {
                  const { data } = await publicService.validateCoupon(coupon);
                  setCouponInfo(data?.data?.coupon || data?.coupon || null);
                } catch (e) {
                  setCouponInfo(null);
                  toast.error(e?.response?.data?.message || 'Cupom inválido');
                }
              }}>Aplicar</button>
            </div>
            {couponInfo && <p className="text-green-700 text-sm mt-1">Cupom aplicado: {couponInfo.code}</p>}
          </div>
        </div>
        <div className="px-5 py-4 border-t flex justify-end gap-2">
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isLoading || !startDate || !endDate || (avail && avail.available === false)}
          >
            {createMutation.isLoading ? 'Enviando...' : 'Confirmar reserva'}
          </button>
        </div>
      </div>
    </div>
  );
}
