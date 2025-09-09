import React from 'react';
import { paymentService } from '../services/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  amount: z.preprocess((v)=> Number(v), z.number().min(0.01, 'Valor inválido')),
  payment_method: z.enum(['pix','bank_transfer','cash','credit_card','debit_card']),
  payer_name: z.string().optional(),
  payer_document: z.string().optional(),
  payer_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  payer_phone: z.string().optional(),
  receipt: z.any().optional()
});

export default function PaymentModal({ reservation, onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: reservation?.total_amount || 0,
      payment_method: 'pix',
      payer_name: '', payer_document: '', payer_email: '', payer_phone: ''
    }
  });
  const method = watch('payment_method');

  async function onSubmit(values) {
    try {
      const payload = {
        reservation_id: reservation.id,
        payment_method: values.payment_method,
        amount: Number(values.amount) || 0,
        payer_name: values.payer_name || undefined,
        payer_document: values.payer_document || undefined,
        payer_email: values.payer_email || undefined,
        payer_phone: values.payer_phone || undefined,
      };
      const res = await paymentService.createManual(payload);
      const payment = res.data?.data?.payment || res.data?.payment || res.data;
      const file = values.receipt?.[0];
      if (file && payment?.id) {
        await paymentService.uploadReceipt(payment.id, file);
      }
      toast.success('Pagamento registrado com sucesso');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Falha ao registrar pagamento');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pagamento da reserva {reservation?.reservation_code}</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Valor</label>
            <input type="number" step="0.01" className="input w-full" {...register('amount')} />
            {errors.amount && <p className="text-primary-700 text-sm mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Método</label>
            <div className="grid grid-cols-2 gap-2">
              {['pix','bank_transfer','cash','credit_card','debit_card'].map(m => (
                <label key={m} className={`border rounded px-3 py-2 cursor-pointer ${method === m ? 'border-primary-600' : 'border-gray-200'}`}>
                  <input type="radio" className="mr-2" value={m} {...register('payment_method')} />
                  {labelFor(m)}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nome do pagador (opcional)</label>
              <input className="input w-full" {...register('payer_name')} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Documento (CPF/CNPJ)</label>
              <input className="input w-full" {...register('payer_document')} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">E-mail</label>
              <input type="email" className="input w-full" {...register('payer_email')} />
              {errors.payer_email && <p className="text-primary-700 text-sm mt-1">{errors.payer_email.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Telefone</label>
              <input className="input w-full" {...register('payer_phone')} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Anexar recibo (opcional)</label>
            <input type="file" accept="image/*,.pdf" {...register('receipt')} onChange={e=> setValue('receipt', e.target.files)} />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Registrar pagamento'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function labelFor(m) {
  switch (m) {
    case 'pix': return 'Pix';
    case 'bank_transfer': return 'Transferência';
    case 'cash': return 'Dinheiro';
    case 'credit_card': return 'Cartão (manual)';
    case 'debit_card': return 'Débito (manual)';
    default: return m;
  }
}
