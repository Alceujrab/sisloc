import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reservationService, formatters, customerPortalService } from '../services/api';
import SignaturePad from '../components/SignaturePad';

export default function ReservationDetailPage(){
  const { id } = useParams();
  const [resv, setResv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [signatureBlob, setSignatureBlob] = useState(null);
  const [sendingSignature, setSendingSignature] = useState(false);
  const [sigMsg, setSigMsg] = useState(null);
  const [sigErr, setSigErr] = useState(null);
  const [extendOpen, setExtendOpen] = useState(false);
  const [newEndDate, setNewEndDate] = useState('');
  const [extending, setExtending] = useState(false);
  const [extendMsg, setExtendMsg] = useState(null);

  useEffect(()=>{
    let active = true;
    (async()=>{
      try{
        const { data } = await reservationService.getById(id);
        if(!active) return;
        setResv(data.data.reservation);
      } finally { setLoading(false); }
    })();
    return ()=>{ active=false };
  },[id]);

  if(loading) return <div className="p-4">Carregando…</div>;
  if(!resv) return <div className="p-4">Reserva não encontrada.</div>;

  const v = resv.vehicle;
  return (
    <div className="max-w-5xl mx-auto p-6">
      <nav className="text-sm text-gray-500 mb-4"><Link to="/">Início</Link> / <Link to="/reservations">Minhas reservas</Link> / #{resv.id}</nav>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <div className="font-semibold mb-1">Veículo</div>
          <div className="flex gap-3 items-center">
            <img src={v?.thumbnail || v?.images?.[0]} alt={v?.model} className="w-28 h-20 object-cover rounded" />
            <div>
              <div className="font-medium">{v?.brand} {v?.model}</div>
              <div className="text-sm text-gray-600">{formatters.date(resv.start_date)} → {formatters.date(resv.end_date)}</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-700">
            <div>Diária: {formatters.currency(resv.daily_rate)}</div>
            <div>Seguro diário: {formatters.currency(resv.insurance_daily)}</div>
            <div>Extras: {formatters.currency(resv.extras_total)}</div>
            <div>Subtotal: {formatters.currency(resv.subtotal + resv.insurance_total + resv.extras_total)}</div>
            {Number(resv.discount_amount) > 0 && (
              <div className="text-green-700">
                Desconto{resv.coupon_code ? ` (${resv.coupon_code})` : ''}: -{formatters.currency(resv.discount_amount)}
              </div>
            )}
            <div className="font-semibold">Total: {formatters.currency(resv.total_amount)}</div>
          </div>
        </div>

        <div className="p-4 border rounded">
          <div className="font-semibold mb-1">Linha do tempo</div>
          <ol className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            {(resv.timeline||[]).map(t => (
              <li key={t.key}>{t.label}: {t.at ? formatters.dateTime(t.at) : '-'}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-6 p-4 border rounded">
        <div className="font-semibold mb-2">Pagamentos</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left"><th>Data</th><th>Método</th><th>Valor</th><th>Status</th><th>Recibo</th></tr>
          </thead>
          <tbody>
            {(resv.payments||[]).map(p => (
              <tr key={p.id} className="border-t">
                <td>{formatters.dateTime(p.created_at)}</td>
                <td>{p.payment_method}</td>
                <td>{formatters.currency(p.amount)}</td>
                <td>{p.status}</td>
                <td>{p.receipt_url ? <a className="text-primary-600" href={p.receipt_url} target="_blank" rel="noreferrer">ver</a> : '-'}</td>
              </tr>
            ))}
            {(!resv.payments || resv.payments.length===0) && (
              <tr><td colSpan="5" className="text-gray-600">Sem pagamentos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <a className="inline-flex items-center px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" href={customerPortalService.getContractPdfUrl(resv.id)} target="_blank" rel="noreferrer">
          Baixar contrato (PDF)
        </a>
        <button
          className="inline-flex items-center px-4 py-2 rounded border hover:bg-gray-50"
          disabled={accepting}
          onClick={async()=>{
            try{
              setAccepting(true);
              await customerPortalService.acceptContract(resv.id);
              const { data } = await reservationService.getById(id);
              setResv(data.data.reservation);
            } finally { setAccepting(false); }
          }}
        >
          {resv.contract_accepted_at ? `Aceito em ${formatters.dateTime(resv.contract_accepted_at)}` : (accepting ? 'Registrando aceite...' : 'Aceitar contrato')}
        </button>
        <button
          className="inline-flex items-center px-4 py-2 rounded border hover:bg-gray-50"
          onClick={()=>{ setExtendOpen(true); setExtendMsg(null); setNewEndDate(resv.end_date?.slice(0,10)||''); }}
        >
          Estender reserva
        </button>
      </div>

      {extendMsg && (
        <div className="mt-3 p-2 rounded bg-green-50 text-green-700 text-sm">{extendMsg}</div>
      )}

      {extendOpen && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <div className="font-semibold mb-2">Nova data de devolução</div>
          <div className="flex items-center gap-3 flex-wrap">
            <input type="date" className="border rounded px-2 py-1" value={newEndDate} onChange={e=>setNewEndDate(e.target.value)} />
            <button
              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={!newEndDate || extending}
              onClick={async()=>{
                try{
                  setExtending(true);
                  await reservationService.extend(resv.id, { new_end_date: newEndDate });
                  const { data } = await reservationService.getById(id);
                  setResv(data.data.reservation);
                  setExtendOpen(false);
                  setExtendMsg('Reserva estendida com sucesso. Valores atualizados.');
                } catch(e){
                  alert(e.response?.data?.message || e.message || 'Falha ao estender reserva.');
                } finally { setExtending(false); }
              }}
            >{extending ? 'Enviando…' : 'Confirmar extensão'}</button>
            <button className="px-3 py-1.5 border rounded hover:bg-gray-100" onClick={()=>setExtendOpen(false)}>Cancelar</button>
          </div>
          <div className="text-xs text-gray-600 mt-2">Observação: a disponibilidade é checada com buffer operacional. Alterações podem ajustar o total da reserva.</div>
        </div>
      )}

      <div className="mt-6 p-4 border rounded">
        <div className="font-semibold mb-2">Assinatura do contrato</div>
        {resv.contract_signature_url ? (
          <div className="text-sm text-gray-700">
            {sigMsg && <div className="mb-2 p-2 rounded bg-green-50 text-green-700">{sigMsg}</div>}
            {sigErr && <div className="mb-2 p-2 rounded bg-red-50 text-red-700">{sigErr}</div>}
            <div className="mb-3">Assinatura atual:</div>
            <img src={resv.contract_signature_url} alt="Assinatura" className="max-w-full h-32 object-contain border rounded bg-white" />
            <div className="mt-3 flex gap-2">
              <button
                className="px-3 py-2 border rounded hover:bg-gray-50"
                onClick={async()=>{
                  setSigMsg(null); setSigErr(null);
                  try{
                    await customerPortalService.deleteSignature(resv.id);
                    const { data } = await reservationService.getById(id);
                    setResv(data.data.reservation);
                    setSigMsg('Assinatura removida.');
                  } catch(e){
                    const m = e.response?.data?.message || e.message || 'Falha ao remover assinatura.';
                    setSigErr(m);
                  }
                }}
              >Remover</button>
              <button
                className="px-3 py-2 border rounded hover:bg-gray-50"
                onClick={()=>{
                  // habilitar modo de substituição mostrando o SignaturePad
                  setResv(r=>({...r, contract_signature_url: null}));
                }}
              >Substituir</button>
            </div>
          </div>
        ) : (
          <div>
            {sigMsg && <div className="mb-2 p-2 rounded bg-green-50 text-green-700">{sigMsg}</div>}
            {sigErr && <div className="mb-2 p-2 rounded bg-red-50 text-red-700">{sigErr}</div>}
            <SignaturePad width={500} height={200} onChange={setSignatureBlob} />
            <button
              className="mt-3 inline-flex items-center px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
              disabled={!signatureBlob || sendingSignature}
              onClick={async()=>{
                try{
                  setSigMsg(null); setSigErr(null);
                  setSendingSignature(true);
                  await customerPortalService.uploadSignature(resv.id, signatureBlob);
                  const { data } = await reservationService.getById(id);
                  setResv(data.data.reservation);
                  setSigMsg('Assinatura enviada com sucesso. O PDF já inclui a assinatura.');
                } finally { setSendingSignature(false); }
              }}
            >
              {sendingSignature ? 'Enviando assinatura...' : 'Enviar assinatura'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
