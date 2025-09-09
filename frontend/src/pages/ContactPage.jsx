import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicService } from '../services/api';

export default function ContactPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-contact'],
    queryFn: () => publicService.getContactInfo(),
    select: (res) => res.data?.data?.contact || null,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Contato</h1>
      {isLoading && <p className="text-gray-600">Carregando...</p>}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Canais</h2>
              <ul className="space-y-2 text-gray-700">
                {data?.email && (
                  <li><span className="font-medium">E-mail:</span> {data.email}</li>
                )}
                {data?.phone && (
                  <li><span className="font-medium">Telefone:</span> {data.phone}</li>
                )}
                {data?.whatsapp && (
                  <li><span className="font-medium">WhatsApp:</span> {data.whatsapp}</li>
                )}
                {data?.address && (
                  <li><span className="font-medium">Endereço:</span> {data.address}</li>
                )}
                {data?.opening_hours && (
                  <li><span className="font-medium">Horário de atendimento:</span> {data.opening_hours}</li>
                )}
              </ul>
            </div>
          </div>

          <div>
            <div className="card p-2 overflow-hidden">
              {data?.map_embed_url ? (
                <iframe
                  src={data.map_embed_url}
                  title="Mapa"
                  width="100%"
                  height="360"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="p-6 text-gray-600">Mapa indisponível no momento.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
