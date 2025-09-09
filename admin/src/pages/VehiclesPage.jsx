import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'react-hot-toast';

function VehiclesPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data, isLoading, error } = useQuery(['admin-vehicles'], async () => {
    const res = await api.get('/admin/vehicles?limit=20');
    return res.data.data;
  });

  const createVehicle = useMutation({
    mutationFn: (payload) => api.post('/admin/vehicles', payload),
    onSuccess: () => { qc.invalidateQueries(['admin-vehicles']); toast.success('Veículo criado'); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Erro ao criar')
  });

  const updateVehicle = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/admin/vehicles/${id}`, payload),
    onSuccess: () => { qc.invalidateQueries(['admin-vehicles']); toast.success('Veículo atualizado'); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Erro ao atualizar')
  });

  const deleteVehicle = useMutation({
    mutationFn: (id) => api.delete(`/admin/vehicles/${id}`),
    onSuccess: () => { qc.invalidateQueries(['admin-vehicles']); toast.success('Veículo excluído'); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Erro ao excluir')
  });

  if (isLoading) return <p>Carregando...</p>;
  if (error) return <p className="text-blue-700">Erro ao carregar veículos</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Veículos</h2>
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => { setEditing(null); setModalOpen(true); }}>
          Novo Veículo
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-50">
            <tr>
              <Th>Placa</Th>
              <Th>Marca</Th>
              <Th>Modelo</Th>
              <Th>Categoria</Th>
              <Th>Diária</Th>
              <Th>Status</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {data.vehicles.map(v => (
              <tr key={v.id} className="border-t">
                <Td>{v.license_plate}</Td>
                <Td>{v.brand}</Td>
                <Td>{v.model}</Td>
                <Td>{v.category}</Td>
                <Td>R$ {Number(v.daily_rate).toFixed(2)}</Td>
                <Td>{v.status}</Td>
                <Td>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 text-sm border rounded" onClick={() => { setEditing(v); setModalOpen(true); }}>Editar</button>
                    <button
                      className="px-2 py-1 text-sm border rounded"
                      onClick={() => {
                        if (confirm(`Excluir veículo ${v.license_plate}?`)) {
                          deleteVehicle.mutate(v.id);
                        }
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <VehicleModal
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSubmit={async (values) => {
            if (editing) {
              await updateVehicle.mutateAsync({ id: editing.id, payload: values });
            } else {
              await createVehicle.mutateAsync(values);
            }
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Th({ children }) {
  return <th className="text-left p-2 border-b">{children}</th>;
}

function Td({ children }) {
  return <td className="p-2">{children}</td>;
}

export default VehiclesPage;

function VehicleModal({ initial, onClose, onSubmit }) {
  const [form, setForm] = useState(() => initial || {
    brand: '', model: '', year: new Date().getFullYear(), color: '', license_plate: '',
    category: 'compact', transmission: 'manual', fuel_type: 'flex', doors: 4, seats: 5, daily_rate: 0,
    insurance_daily: 0, status: 'available'
  });

  const isEdit = Boolean(initial);

  const categories = useMemo(() => ['compact','sedan','suv','luxury','van','truck'], []);
  const transmissions = ['manual','automatic'];
  const fuels = ['gasoline','ethanol','flex','diesel','electric','hybrid'];
  const statuses = ['available','rented','maintenance','inactive'];

  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.brand) e.brand = 'Informe a marca';
    if (!form.model) e.model = 'Informe o modelo';
    if (!form.license_plate) e.license_plate = 'Informe a placa';
    if (form.daily_rate === '' || Number(form.daily_rate) < 0) e.daily_rate = 'Diária inválida';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
      <div className="bg-white w-full max-w-2xl rounded shadow p-6 space-y-4">
        <h3 className="text-xl font-semibold">{isEdit ? 'Editar Veículo' : 'Novo Veículo'}</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Marca">
            <input className="border rounded px-2 py-1 w-full" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
            {errors.brand && <p className="text-blue-700 text-xs mt-1">{errors.brand}</p>}
          </Field>
          <Field label="Modelo">
            <input className="border rounded px-2 py-1 w-full" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
            {errors.model && <p className="text-blue-700 text-xs mt-1">{errors.model}</p>}
          </Field>
          <Field label="Ano">
            <input type="number" className="border rounded px-2 py-1 w-full" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} />
          </Field>
          <Field label="Cor">
            <input className="border rounded px-2 py-1 w-full" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
          </Field>
          <Field label="Placa">
            <input className="border rounded px-2 py-1 w-full" value={form.license_plate} onChange={e => setForm({ ...form, license_plate: e.target.value })} />
            {errors.license_plate && <p className="text-blue-700 text-xs mt-1">{errors.license_plate}</p>}
          </Field>
          <Field label="Categoria">
            <select className="border rounded px-2 py-1 w-full" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Transmissão">
            <select className="border rounded px-2 py-1 w-full" value={form.transmission} onChange={e => setForm({ ...form, transmission: e.target.value })}>
              {transmissions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Combustível">
            <select className="border rounded px-2 py-1 w-full" value={form.fuel_type} onChange={e => setForm({ ...form, fuel_type: e.target.value })}>
              {fuels.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Portas">
            <input type="number" className="border rounded px-2 py-1 w-full" value={form.doors ?? ''} onChange={e => setForm({ ...form, doors: Number(e.target.value) })} />
          </Field>
          <Field label="Assentos">
            <input type="number" className="border rounded px-2 py-1 w-full" value={form.seats ?? ''} onChange={e => setForm({ ...form, seats: Number(e.target.value) })} />
          </Field>
          <Field label="Diária (R$)">
            <input type="number" step="0.01" className="border rounded px-2 py-1 w-full" value={form.daily_rate} onChange={e => setForm({ ...form, daily_rate: e.target.value })} />
            {errors.daily_rate && <p className="text-blue-700 text-xs mt-1">{errors.daily_rate}</p>}
          </Field>
          <Field label="Seguro Diário (R$)">
            <input type="number" step="0.01" className="border rounded px-2 py-1 w-full" value={form.insurance_daily} onChange={e => setForm({ ...form, insurance_daily: e.target.value })} />
          </Field>
          <Field label="Status">
            <select className="border rounded px-2 py-1 w-full" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-3 py-2 border rounded" onClick={onClose}>Cancelar</button>
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => { if (validate()) onSubmit(form); else toast.error('Corrija os campos destacados'); }}>
            {isEdit ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="text-sm">
      <div className="mb-1 text-gray-600">{label}</div>
      {children}
    </label>
  );
}
