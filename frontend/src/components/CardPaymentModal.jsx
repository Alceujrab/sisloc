import React, { useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { paymentService } from '../services/api';
import toast from 'react-hot-toast';

const stripePromiseCache = {};
function getStripe(pk) {
  if (!stripePromiseCache[pk]) stripePromiseCache[pk] = loadStripe(pk);
  return stripePromiseCache[pk];
}

function InnerCardForm({ reservation, onClose, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  async function handlePay(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    try {
      setLoading(true);
      // 1) Cria PaymentIntent no backend
      const intentRes = await paymentService.createPaymentIntent({
        reservation_id: reservation.id,
        payment_method: 'credit_card',
      });
      const clientSecret = intentRes.data?.data?.client_secret || intentRes.data?.client_secret;
      if (!clientSecret) throw new Error('Falha ao criar intenção de pagamento');

      // 2) Confirma pagamento com Stripe
      const card = elements.getElement(CardElement);
  const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (result.error) {
        toast.error(result.error.message || 'Pagamento não autorizado');
        return;
      }

      // 3) Confirma no backend (atualiza reserva/pagamento)
      const confirmRes = await paymentService.confirmPayment({
        payment_intent_id: result.paymentIntent.id,
      });
      if (confirmRes.data?.success) {
        toast.success('Pagamento confirmado!');
        onSuccess?.();
        onClose?.();
      } else {
        toast('Pagamento processado, aguardando confirmação.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Erro no pagamento');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="p-3 border rounded">
        <CardElement options={{ hidePostalCode: true }} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={!stripe || loading}>
          {loading ? 'Processando...' : 'Pagar com cartão'}
        </button>
      </div>
    </form>
  );
}

export default function CardPaymentModal({ reservation, onClose, onSuccess, stripePublicKey }) {
  const stripePromise = useMemo(() => getStripe(stripePublicKey), [stripePublicKey]);
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pagar com cartão — {reservation?.reservation_code}</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>&times;</button>
        </div>
        <div className="p-4">
          <Elements stripe={stripePromise}>
            <InnerCardForm reservation={reservation} onClose={onClose} onSuccess={onSuccess} />
          </Elements>
        </div>
      </div>
    </div>
  );
}
