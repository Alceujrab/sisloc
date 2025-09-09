import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationService, paymentService } from '../services/api';
import PaymentModal from '../components/PaymentModal';
import CardPaymentModal from '../components/CardPaymentModal';

export default function UserReservationsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery(['my-reservations'], async () => {
    const res = await reservationService.getAll();
    return res.data?.data || res.data;
  });

  const { data: payData } = useQuery(['my-payments', { limit: 100 }], async () => {
    const res = await paymentService.getHistory({ limit: 100, page: 1 });
    return res.data?.data || res.data;
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => reservationService.cancel(id),
    onSuccess: () => qc.invalidateQueries(['my-reservations'])
  });

  const list = data?.reservations || data?.rows || [];
  const [paying, setPaying] = useState(null);
  const [cardPaying, setCardPaying] = useState(null);

  const latestPaymentByReservation = React.useMemo(() => {
    const map = new Map();
    const payments = payData?.payments || [];
    for (const p of payments) {
      const rid = p.reservation?.id || p.reservation_id;
      if (!rid) continue;
      const prev = map.get(rid);
      if (!prev) map.set(rid, p);
      else {
        const prevTs = new Date(prev.created_at || 0).getTime();
        const curTs = new Date(p.created_at || 0).getTime();
        if (curTs > prevTs) map.set(rid, p);
      }
    }
    return map;
  }, [payData]);

  const receiptUrl = (url) => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    return `http://localhost:5000${url}`;
  };

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Minhas Reservas</h1>
      {isLoading && <p className="text-gray-600">Carregando...</p>}
      {error && <p className="text-primary-700">Erro ao carregar reservas.</p>}
      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-gray-50">
              <tr>
                <Th>Código</Th>
                <Th>Veículo</Th>
                <Th>Período</Th>
                <Th>Status</Th>
                <Th>Pagamento</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {list.map(r => (
                <tr key={r.id} className="border-t">
                  <Td>{r.reservation_code}</Td>
                  <Td>{r.vehicle?.brand} {r.vehicle?.model}</Td>
                  <Td>
                    {new Date(r.start_date).toLocaleDateString()} - {new Date(r.end_date).toLocaleDateString()}
                    <div className="text-xs text-gray-600">Total: {new Intl.NumberFormat('pt-BR',{ style:'currency', currency:'BRL'}).format(r.total_amount || 0)}</div>
                    {Number(r.discount_amount) > 0 && (
                      <div className="text-xs text-green-700">Desconto{r.coupon_code ? ` (${r.coupon_code})` : ''}: -{new Intl.NumberFormat('pt-BR',{ style:'currency', currency:'BRL'}).format(r.discount_amount)}</div>
                    )}
                  </Td>
                  <Td>{r.status}</Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">Reserva: {r.payment_status || 'pending'}</span>
                      {latestPaymentByReservation.get(r.id) && (
                        <span className="text-sm">Pagamento: {latestPaymentByReservation.get(r.id).status}</span>
                      )}
                      {latestPaymentByReservation.get(r.id)?.receipt_url && (
                        <a
                          className="text-primary-700 text-sm underline"
                          href={receiptUrl(latestPaymentByReservation.get(r.id).receipt_url)}
                          target="_blank" rel="noreferrer"
                        >
                          Ver recibo
                        </a>
                      )}
                    </div>
                  </Td>
                  <Td className="space-x-2">
                    {(r.status === 'pending' || r.status === 'confirmed') && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => cancelMutation.mutate(r.id)}
                        disabled={cancelMutation.isLoading}
                      >
                        Cancelar
                      </button>
                    )}
                    {r.status === 'pending' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setPaying(r)}
                      >
                        Pagar agora
                      </button>
                    )}
                    {r.status === 'pending' && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setCardPaying(r)}
                      >
                        Pagar com cartão
                      </button>
                    )}
                  </Td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-600">Nenhuma reserva encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
    {paying && (
      <PaymentModal
        reservation={paying}
        onClose={() => setPaying(null)}
        onSuccess={() => {
          setPaying(null);
          qc.invalidateQueries(['my-reservations']);
        }}
      />
    )}
    {cardPaying && (
      <CardPaymentModal
        reservation={cardPaying}
        stripePublicKey={import.meta.env.VITE_STRIPE_PUBLIC_KEY || ''}
        onClose={() => setCardPaying(null)}
        onSuccess={() => {
          setCardPaying(null);
          qc.invalidateQueries(['my-reservations']);
        }}
      />
    )}
    </>
  );
}

function Th({ children }) {
  return <th className="text-left p-2 border-b">{children}</th>;
}

function Td({ children }) {
  return <td className="p-2">{children}</td>;
}
