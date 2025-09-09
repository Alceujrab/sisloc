import React, { useEffect, useMemo, useState } from 'react';
import { publicService, formatters } from '../services/api';
import { Car, Gauge, Snowflake, Users2, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import PlanPricingCta from '../components/PlanPricingCta';

// Mapeia palavras-chave de features para ícones/labels amigáveis
const featureIcon = (text = '') => {
  const t = String(text).toLowerCase();
  if (t.includes('ar') || t.includes('ar-cond') || t.includes('ar cond')) return { Icon: Snowflake, label: 'Ar-condicionado' };
  if (t.includes('passag') || t.match(/\b(4|5|7)\b/) || t.includes('lugares')) return { Icon: Users2, label: text };
  if (t.includes('mala') || t.includes('bag') || t.includes('porta-malas')) return { Icon: Briefcase, label: text };
  if (t.includes('auto') || t.includes('cvt') || t.includes('manual') || t.includes('câmbio')) return { Icon: Gauge, label: text };
  return { Icon: Car, label: text };
};

function GroupCard({ group, minMap }){
  const [open, setOpen] = useState(false);
  const feats = useMemo(() => Array.isArray(group.features) ? group.features.slice(0, 6) : [], [group.features]);
  const min = minMap?.[group.id];

  return (
    <div className="rounded-xl border border-blue-100 overflow-hidden bg-white hover:shadow-lg transition-shadow">
      {/* Imagem / placeholder */}
      {group.image_url ? (
        <img src={group.image_url} alt={group.name} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center">
          <Car className="text-white" size={64} />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {group.code}
          </span>
          <button onClick={() => setOpen(v => !v)} className="text-sm text-blue-700 hover:underline">
            {open ? 'Ocultar detalhes' : 'Mostrar detalhes'}
          </button>
        </div>

        <h3 className="mt-2 text-lg font-semibold text-gray-900">{group.name}</h3>

        {/* Linha de features resumidas com ícones */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {feats.map((f, i) => {
            const { Icon, label } = featureIcon(f);
            return (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <Icon size={16} className="text-blue-600" />
                <span className="truncate" title={label}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* Detalhes expansíveis */}
        {open && (
          <div className="mt-3 text-sm text-gray-700">
            {group.description && <p className="mb-2">{group.description}</p>}
            {Array.isArray(group.features) && group.features.length > 0 && (
              <ul className="list-disc pl-5 space-y-1">
                {group.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm text-blue-700 font-semibold">
            {typeof min === 'number' ? `a partir de ${formatters.currency(min)}/dia` : '\u00A0'}
          </div>
          <Link
            to={`/vehicles?group_id=${group.id}`}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Reservar agora
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function GroupsPage(){
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minMap, setMinMap] = useState({});
  const [error, setError] = useState('');
  useEffect(()=>{
    (async()=>{
      try {
        setError('');
        const [groupsRes, minsRes] = await Promise.all([
          publicService.getGroups(),
          publicService.getGroupMinimums()
        ]);
        const gs = groupsRes?.data?.data?.groups || [];
        setGroups(gs);
        const mins = minsRes?.data?.data?.minimums || [];
        const map = {};
        for (const m of mins) {
          if (m.group_id != null && typeof m.min_rate === 'number') {
            map[m.group_id] = m.min_rate;
          }
        }
        setMinMap(map);
      } catch (e) {
        setError('Não foi possível carregar os grupos agora. Tente novamente em instantes.');
      } finally { setLoading(false); }
    })();
  },[]);
  // Agrupa por category para navegação por âncora
  const groupsByCategory = useMemo(() => {
    const map = {};
    for (const g of groups) {
      const cat = g.category || 'outros';
      if (!map[cat]) map[cat] = [];
      map[cat].push(g);
    }
    return map;
  }, [groups]);

  const order = ['economico', 'suv', 'pickup', 'sedan', 'van', 'luxo', 'outros'];
  const label = (cat) => ({
    economico: 'Econômicos',
    suv: 'SUVs',
    pickup: 'Pick-ups',
    sedan: 'Sedans',
    van: 'Vans',
    luxo: 'Luxo',
    outros: 'Outros'
  }[cat] || cat);

  if(loading) return <div className="p-6">Carregando…</div>;

  return (
    <div>
      <Seo
        title="Grupos de Carros"
        description="Conheça nossos grupos de carros (econômicos, sedans, SUVs e mais) e veja preços a partir por dia."
        canonical={typeof window !== 'undefined' ? `${window.location.origin}/groups` : undefined}
      />
      {/* Cabeçalho azul */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 py-10 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-3xl font-semibold">Grupos de Carros</h1>
          <p className="mt-2 text-blue-100">Encontre o grupo ideal para sua viagem: compacto, sedan, SUV, pick-up e mais.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 rounded border border-blue-200 bg-blue-50 text-blue-800 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Navegação rápida por categoria */}
        {Object.keys(groupsByCategory).length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {order.filter(cat => groupsByCategory[cat]?.length).map(cat => (
              <a key={cat} href={`#cat-${cat}`} className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-sm hover:bg-blue-100">
                {label(cat)}
              </a>
            ))}
          </div>
        )}

        {groups.length === 0 && !error ? (
          <div className="text-gray-600">Nenhum grupo cadastrado.</div>
        ) : (
          order.filter(cat => groupsByCategory[cat]?.length).map(cat => (
            <section key={cat} id={`cat-${cat}`} className="mb-10">
              <h2 className="text-xl font-semibold mb-4">{label(cat)}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupsByCategory[cat].map(g => <GroupCard key={g.id} group={g} minMap={minMap} />)}
              </div>
            </section>
          ))
        )}

  {/* CTA Planos e Preços */}
  <PlanPricingCta className="mt-4" />
      </div>
    </div>
  );
}
