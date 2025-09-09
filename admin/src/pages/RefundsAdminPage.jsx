import React, { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adminService } from '../services/api';

const actionSchema = z.object({
  status: z.enum(['approved','rejected','processed']),
  reply_message: z.string().optional(),
  refund_amount: z.preprocess((v)=> v === '' || v == null ? undefined : Number(v), z.number().nonnegative().optional())
});

function ActionModal({ open, onClose, onSubmit, refund }){
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(actionSchema), defaultValues: { status: 'approved', reply_message: '' } });
  useEffect(()=>{ reset({ status: refund?.status === 'approved' ? 'processed' : 'approved', reply_message: '', refund_amount: refund?.payment?.amount || undefined }); }, [refund, reset]);
  if (!open) return null;
  const current = refund?.status;
  const allowed = current === 'pending' ? ['approved','rejected'] : current === 'approved' ? ['processed'] : [];
  const status = watch('status');
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-md border shadow-md w-full max-w-md p-4">
        <h3 className="text-lg font-semibold mb-2">Atualizar reembolso</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Novo status</label>
            <select className="border rounded px-3 py-2 w-full" {...register('status')}>
              {allowed.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.status && <p className="text-sm text-blue-700 mt-1">{errors.status.message}</p>}
          </div>
          {status === 'processed' && (
            <div>
              <label className="block text-sm mb-1">Valor do reembolso (opcional)</label>
              <input type="number" step="0.01" className="border rounded px-3 py-2 w-full" placeholder={String(refund?.payment?.amount || '')} {...register('refund_amount')} />
              {errors.refund_amount && <p className="text-sm text-blue-700 mt-1">{errors.refund_amount.message}</p>}
            </div>
          )}
          <div>
            <label className="block text-sm mb-1">Mensagem ao cliente (opcional)</label>
            <textarea className="border rounded px-3 py-2 w-full" rows={3} placeholder="Escreva uma mensagem de retorno" {...register('reply_message')} />
            {errors.reply_message && <p className="text-sm text-blue-700 mt-1">{errors.reply_message.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 border rounded">Cancelar</button>
            <button disabled={isSubmitting} className="px-3 py-2 rounded bg-blue-600 text-white">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailsPanel({ open, onClose, id }){
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  useEffect(()=>{
    let active = true;
    const run = async ()=>{
      if (!open || !id) return;
      setLoading(true); setError('');
      try {
        const { data } = await adminService.getRefundById(id);
        if (!active) return;
        setData(data?.data?.refund || null);
      } catch(e){
        if (!active) return; setError('Falha ao carregar detalhes');
      } finally { if (active) setLoading(false); }
    };
    run();
    return ()=>{ active = false; };
  }, [open, id]);

  if (!open) return null;
  const refund = data;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl border-l p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Detalhes do reembolso</h3>
          <button onClick={onClose} className="px-2 py-1 border rounded">Fechar</button>
        </div>
        {loading ? <div>Carregando…</div> : error ? (
          <div className="rounded border border-blue-200 bg-blue-50 text-blue-800 px-3 py-2 text-sm">{error}</div>
        ) : refund ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-gray-500">Cliente</div>
                <div>{refund.user?.name}</div>
                <div className="text-xs text-gray-500">{refund.user?.email}</div>
              </div>
              <div>
                <div className="text-gray-500">Status</div>
                <div className="inline-block px-2 py-1 text-xs rounded border bg-blue-50 text-blue-800 border-blue-200">{refund.status}</div>
              </div>
              <div>
                <div className="text-gray-500">Motivo</div>
                <div title={refund.reason} className="truncate">{refund.reason}</div>
              </div>
              {refund.payment && (
                <div>
                  <div className="text-gray-500">Pagamento</div>
                  <div>#{refund.payment.id} • R$ {Number(refund.payment.amount||0).toFixed(2)} ({refund.payment.status})</div>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-2">Linha do tempo</h4>
              <ol className="relative border-l border-blue-200 ml-2">
                {(refund.auditLogs||[]).map((log)=> (
                  <li key={log.id} className="ml-4 mb-3">
                    <div className="absolute -left-[7px] w-3 h-3 rounded-full bg-blue-500" />
                    <div className="text-sm">
                      <span className="font-medium capitalize">{log.action}</span>
                      {log.actor ? (
                        <span className="text-gray-600"> por {log.actor.name} ({log.actor.email})</span>
                      ) : null}
                    </div>
                    {log.message && <div className="text-sm">“{log.message}”</div>}
                    <div className="text-xs text-gray-500">{new Date(log.created_at || log.createdAt).toLocaleString('pt-BR')}</div>
                  </li>
                ))}
                {(!refund.auditLogs || refund.auditLogs.length===0) && (
                  <li className="ml-4 text-sm text-gray-500">Sem eventos</li>
                )}
              </ol>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function RefundsAdminPage(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailsId, setDetailsId] = useState(null);

  const load = async (p=1) => {
    setLoading(true); setError('');
    try {
      const { data } = await adminService.getRefunds({ page: p, limit: 10, status: status || undefined });
      setItems(data?.data?.refunds || []);
      setTotalPages(data?.data?.pagination?.totalPages || 1);
      setPage(data?.data?.pagination?.currentPage || p);
    } catch(e){
      setError('Falha ao carregar reembolsos');
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(1); // eslint-disable-next-line
  }, []);

  const badge = (s) => {
    const map = {
      pending: 'bg-blue-50 text-blue-800 border-blue-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      rejected: 'bg-gray-100 text-gray-800 border-gray-200',
      processed: 'bg-blue-200 text-blue-900 border-blue-300'
    };
    return <span className={`px-2 py-1 text-xs rounded border ${map[s]||'bg-gray-100 text-gray-800 border-gray-200'}`}>{s}</span>;
  };

  const openAction = (item) => setSelected(item);
  const closeAction = () => setSelected(null);
  const doAction = async (values) => {
    setError(''); setOk('');
    try {
      await adminService.updateRefundStatus(selected.id, values);
      setOk('Reembolso atualizado com sucesso.');
      closeAction();
      await load(page);
    } catch(e){
      setError('Falha ao atualizar reembolso');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Reembolsos</h1>

      {(error || ok) && (
        <div className="mb-3 space-y-2">
          {error && <div className="rounded border border-blue-200 bg-blue-50 text-blue-800 px-3 py-2 text-sm">{error}</div>}
          {ok && <div className="rounded border border-blue-200 bg-blue-50 text-blue-800 px-3 py-2 text-sm">{ok}</div>}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <select value={status} onChange={(e)=>setStatus(e.target.value)} className="border rounded px-3 py-2">
          <option value="">Todos</option>
          <option value="pending">Pendente</option>
          <option value="approved">Aprovado</option>
          <option value="processed">Processado</option>
          <option value="rejected">Rejeitado</option>
        </select>
        <button onClick={()=>load(1)} className="bg-blue-600 text-white px-4 py-2 rounded">Filtrar</button>
      </div>

      {loading ? (
        <div>Carregando…</div>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2">Data</th>
                <th className="text-left p-2">Cliente</th>
                <th className="text-left p-2">Reserva/Pagamento</th>
                <th className="text-left p-2">Motivo</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-t">
                  <td className="p-2">{new Date(it.created_at || it.createdAt).toLocaleString('pt-BR')}</td>
                  <td className="p-2">{it.user?.name}<div className="text-xs text-gray-500">{it.user?.email}</div></td>
                  <td className="p-2">
                    {it.reservation ? (
                      <div>Reserva {it.reservation.reservation_code || it.reservation.id}</div>
                    ) : <div>-</div>}
                    {it.payment ? (
                      <div className="text-xs text-gray-500">Pgto #{it.payment.id} • R$ {Number(it.payment.amount||0).toFixed(2)} ({it.payment.status})</div>
                    ) : null}
                  </td>
                  <td className="p-2 max-w-xs truncate" title={it.reason}>{it.reason}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 text-xs rounded border ${{
                      pending: 'bg-blue-50 text-blue-800',
                      approved: 'bg-blue-100 text-blue-800',
                      rejected: 'bg-gray-100 text-gray-800',
                      processed: 'bg-blue-200 text-blue-900'
                    }[it.status]||'bg-gray-100 text-gray-800'}`}>{it.status}</span>
                  </td>
                  <td className="p-2 flex gap-2">
                    <button className="px-3 py-1 rounded border" onClick={()=>setDetailsId(it.id)}>Detalhes</button>
                    {['pending','approved'].includes(it.status) ? (
                      <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={()=>openAction(it)}>Atualizar</button>
                    ) : <span className="text-gray-500">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        <button disabled={page<=1} onClick={()=>load(page-1)} className="px-3 py-1 border rounded disabled:opacity-50">Anterior</button>
        <div>Página {page} de {totalPages}</div>
        <button disabled={page>=totalPages} onClick={()=>load(page+1)} className="px-3 py-1 border rounded disabled:opacity-50">Próxima</button>
      </div>

      <ActionModal open={!!selected} onClose={closeAction} onSubmit={doAction} refund={selected} />
      <DetailsPanel open={!!detailsId} onClose={()=>setDetailsId(null)} id={detailsId} />
    </div>
  );
}
