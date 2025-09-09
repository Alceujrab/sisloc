import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  ClipboardList,
  Users,
  CreditCard,
  RotateCcw,
  Image as ImageIcon,
  Phone,
  MapPin,
  Tag,
  FileText,
  Layers,
  BarChart2,
  Settings,
  Menu,
  X,
  Bell,
  ChevronRight,
  Search
} from 'lucide-react';

const navLinkBase = 'flex items-center gap-3 px-3 py-2 rounded-md text-sm';
const navLinkActive = 'bg-blue-600 text-white';
const navLinkInactive = 'text-gray-700 hover:bg-blue-50 hover:text-blue-700';

function SectionTitle({ children }) {
  return <div className="px-3 text-xs font-semibold text-gray-400 uppercase mt-4 mb-2">{children}</div>;
}

function SidebarLink({ to, icon: Icon, children, onClick }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `${navLinkBase} ${isActive ? navLinkActive : navLinkInactive}`}
      onClick={onClick}
    >
      <Icon size={18} />
      <span>{children}</span>
    </NavLink>
  );
}

function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const shortcuts = useMemo(() => ([
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Relatórios', to: '/reports' },
  { label: 'Utilização da Frota', to: '/reports/utilization' },
    { label: 'Reservas', to: '/reservations' },
    { label: 'Pagamentos', to: '/payments' },
    { label: 'Clientes', to: '/customers' },
    { label: 'Veículos', to: '/vehicles' },
    { label: 'Grupos', to: '/groups' },
    { label: 'Locais/Filiais', to: '/locations' },
    { label: 'Banners', to: '/banners' },
    { label: 'Cupons', to: '/coupons' },
    { label: 'Leads', to: '/leads' },
    { label: 'Documentos', to: '/documents' },
  { label: 'Configurações', to: '/settings' },
  { label: 'Regras de Preço', to: '/price-rules' }
  ]), []);

  const results = useMemo(() =>
    shortcuts.filter(s => s.label.toLowerCase().includes(query.toLowerCase())),
    [query, shortcuts]
  );

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => document.getElementById('admin-search-input')?.focus(), 0);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const openAndFocus = () => {
    setSearchOpen(true);
    setTimeout(() => document.getElementById('admin-search-input')?.focus(), 0);
  };

  const go = (to) => {
    setSearchOpen(false);
    setQuery('');
    navigate(to);
  };

  const crumbs = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    const acc = [];
    let path = '';
    for (const p of parts) {
      path += `/${p}`;
      acc.push({ label: p.charAt(0).toUpperCase() + p.slice(1), to: path });
    }
    return acc.length ? acc : [{ label: 'Dashboard', to: '/dashboard' }];
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 rounded hover:bg-gray-100" onClick={() => setOpen(true)} aria-label="Abrir menu">
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-600" />
              <span className="font-bold text-gray-900">Locadora Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden md:flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm text-gray-600 hover:bg-gray-50" onClick={openAndFocus}>
              <Search size={16} />
              <span>Buscar (Ctrl+K)</span>
            </button>
            <button className="p-2 rounded hover:bg-gray-100" aria-label="Notificações">
              <Bell size={18} className="text-gray-600" />
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white grid place-items-center text-xs font-semibold">
              AD
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[240px_1fr] gap-0 md:gap-6 px-4 md:px-6 mt-4">
        {/* Sidebar desktop */}
        <aside className="hidden md:block bg-white border rounded-md p-3 h-fit sticky top-16">
          <nav className="space-y-1">
            <SectionTitle>Visão geral</SectionTitle>
            <SidebarLink to="/dashboard" icon={LayoutDashboard}>Dashboard</SidebarLink>
            <SidebarLink to="/reports" icon={BarChart2}>Relatórios</SidebarLink>
            <SidebarLink to="/reports/utilization" icon={BarChart2}>Utilização da Frota</SidebarLink>

            <SectionTitle>Operação</SectionTitle>
            <SidebarLink to="/reservations" icon={ClipboardList}>Reservas</SidebarLink>
            <SidebarLink to="/payments" icon={CreditCard}>Pagamentos</SidebarLink>
            <SidebarLink to="/refunds" icon={RotateCcw}>Reembolsos</SidebarLink>
            <SidebarLink to="/documents" icon={FileText}>Documentos</SidebarLink>
            <SidebarLink to="/customers" icon={Users}>Clientes</SidebarLink>

            <SectionTitle>Catálogo</SectionTitle>
            <SidebarLink to="/vehicles" icon={Car}>Veículos</SidebarLink>
            <SidebarLink to="/groups" icon={Layers}>Grupos</SidebarLink>
            <SidebarLink to="/locations" icon={MapPin}>Locais/Filiais</SidebarLink>

            <SectionTitle>Marketing</SectionTitle>
            <SidebarLink to="/banners" icon={ImageIcon}>Banners</SidebarLink>
            <SidebarLink to="/coupons" icon={Tag}>Cupons</SidebarLink>
            <SidebarLink to="/leads" icon={Users}>Leads</SidebarLink>

            <SectionTitle>Administração</SectionTitle>
            <SidebarLink to="/contact" icon={Phone}>Contato</SidebarLink>
            <SidebarLink to="/settings" icon={Settings}>Configurações</SidebarLink>
            <SidebarLink to="/price-rules" icon={Tag}>Regras de Preço</SidebarLink>
          </nav>
        </aside>

        {/* Conteúdo */}
        <main className="min-h-[calc(100vh-4rem)]">
          <div className="mb-3 text-sm text-gray-600 flex items-center gap-1">
            <Link to="/dashboard" className="hover:text-blue-700">Dashboard</Link>
            {crumbs.filter(c => c.to !== '/dashboard').map((c) => (
              <span key={c.to} className="flex items-center gap-1">
                <ChevronRight size={14} className="text-gray-400" />
                <Link to={c.to} className="hover:text-blue-700">{c.label}</Link>
              </span>
            ))}
          </div>
          <div className="bg-white border rounded-md p-4 md:p-6 shadow-sm">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-600" />
                <span className="font-bold text-gray-900">Menu</span>
              </div>
              <button className="p-2 rounded hover:bg-gray-100" onClick={() => setOpen(false)} aria-label="Fechar menu">
                <X size={18} />
              </button>
            </div>
            <nav className="space-y-1" onClick={() => setOpen(false)}>
              <SectionTitle>Visão geral</SectionTitle>
              <SidebarLink to="/dashboard" icon={LayoutDashboard}>Dashboard</SidebarLink>
              <SidebarLink to="/reports" icon={BarChart2}>Relatórios</SidebarLink>
              <SidebarLink to="/reports/utilization" icon={BarChart2}>Utilização da Frota</SidebarLink>

              <SectionTitle>Operação</SectionTitle>
              <SidebarLink to="/reservations" icon={ClipboardList}>Reservas</SidebarLink>
              <SidebarLink to="/payments" icon={CreditCard}>Pagamentos</SidebarLink>
              <SidebarLink to="/refunds" icon={RotateCcw}>Reembolsos</SidebarLink>
              <SidebarLink to="/documents" icon={FileText}>Documentos</SidebarLink>
              <SidebarLink to="/customers" icon={Users}>Clientes</SidebarLink>

              <SectionTitle>Catálogo</SectionTitle>
              <SidebarLink to="/vehicles" icon={Car}>Veículos</SidebarLink>
              <SidebarLink to="/groups" icon={Layers}>Grupos</SidebarLink>
              <SidebarLink to="/locations" icon={MapPin}>Locais/Filiais</SidebarLink>

              <SectionTitle>Marketing</SectionTitle>
              <SidebarLink to="/banners" icon={ImageIcon}>Banners</SidebarLink>
              <SidebarLink to="/coupons" icon={Tag}>Cupons</SidebarLink>
              <SidebarLink to="/leads" icon={Users}>Leads</SidebarLink>

              <SectionTitle>Administração</SectionTitle>
              <SidebarLink to="/contact" icon={Phone}>Contato</SidebarLink>
              <SidebarLink to="/settings" icon={Settings}>Configurações</SidebarLink>
              <SidebarLink to="/price-rules" icon={Tag}>Regras de Preço</SidebarLink>
            </nav>
          </div>
        </div>
      )}

      {/* Modal de busca */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSearchOpen(false)} />
          <div className="relative mt-20 w-full max-w-xl bg-white rounded-lg shadow-lg border">
            <div className="flex items-center gap-2 p-3 border-b">
              <Search size={18} className="text-gray-500" />
              <input
                id="admin-search-input"
                className="flex-1 outline-none"
                placeholder="Buscar páginas…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button className="p-1.5 rounded hover:bg-gray-100" onClick={() => setSearchOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="max-h-80 overflow-auto">
              {results.length === 0 && (
                <div className="p-4 text-sm text-gray-500">Nenhum resultado</div>
              )}
              {results.map(r => (
                <button
                  key={r.to}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50"
                  onClick={() => go(r.to)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLayout;
