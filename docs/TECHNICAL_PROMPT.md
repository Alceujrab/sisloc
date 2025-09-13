# Prompt Técnico para Implementação - Sistema de Locadora de Veículos

## Estrutura do Sistema SISLOC

### Arquitetura Base
- **Frontend**: React.js 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js + Sequelize ORM
- **Banco de Dados**: PostgreSQL (produção) / MySQL (desenvolvimento)
- **Autenticação**: JWT + Bcrypt
- **Pagamentos**: Stripe API
- **Deploy**: cPanel + Passenger (Node.js App)

### URLs do Sistema
- **Frontend Cliente**: `/` (página principal)
- **Portal Administrativo**: `/admin`
- **API Backend**: `/api/*`
- **Portal do Cliente**: `/portal` (área logada)

## Prompts de Desenvolvimento por Funcionalidade

### 1. Homepage Hero Section

```jsx
// Prompt para seção hero principal
const heroContent = {
  title: "Alugue o carro perfeito para sua viagem",
  subtitle: "Frota moderna, preços justos e atendimento excepcional. Sua aventura começa aqui!",
  ctaPrimary: "Ver Veículos",
  ctaSecondary: "Ver Grupos",
  backgroundGradient: "from-blue-900 via-blue-800 to-blue-600",
  searchForm: {
    fields: ["pickup_location", "start_date", "end_date", "category"],
    placeholder: "Onde você quer retirar?",
    submitText: "Buscar Veículos"
  }
};
```

### 2. Sistema de Busca e Filtros

```jsx
// Prompt para filtros de veículos
const searchFilters = {
  categories: ["compact", "sedan", "suv", "luxury"],
  priceRange: { min: 50, max: 500, step: 25 },
  features: ["air_conditioning", "gps", "bluetooth", "automatic"],
  seats: [2, 4, 5, 7, 8],
  fuelType: ["gasoline", "ethanol", "diesel", "hybrid", "electric"],
  transmission: ["manual", "automatic"],
  sortOptions: ["price_asc", "price_desc", "rating", "newest"]
};
```

### 3. Portal do Cliente - Dashboard

```jsx
// Prompt para área do cliente
const customerPortalSections = {
  dashboard: {
    welcomeMessage: "Bem-vindo de volta!",
    quickStats: ["active_reservations", "loyalty_points", "total_rentals"],
    quickActions: ["new_reservation", "view_history", "manage_favorites"]
  },
  reservations: {
    status: ["pending", "confirmed", "active", "completed", "cancelled"],
    actions: ["view_details", "modify", "cancel", "extend"]
  },
  loyalty: {
    pointsSystem: "1 real = 1 ponto",
    rewards: ["free_days", "upgrades", "discounts"],
    tiers: ["bronze", "silver", "gold", "platinum"]
  }
};
```

### 4. Painel Administrativo

```jsx
// Prompt para painel admin
const adminPanelFeatures = {
  dashboard: {
    kpis: ["daily_revenue", "active_rentals", "fleet_utilization", "customer_satisfaction"],
    charts: ["revenue_trend", "popular_vehicles", "seasonal_demand"]
  },
  vehicleManagement: {
    actions: ["add_vehicle", "edit_details", "update_availability", "set_maintenance"],
    bulkOperations: ["import_csv", "update_prices", "set_featured"]
  },
  customerManagement: {
    features: ["view_profile", "rental_history", "loyalty_status", "support_tickets"],
    communications: ["email_campaigns", "sms_notifications", "in_app_messages"]
  }
};
```

### 5. Sistema de Pagamentos

```jsx
// Prompt para integração de pagamentos
const paymentIntegration = {
  stripe: {
    methods: ["card", "pix", "boleto"],
    features: ["saved_cards", "installments", "refunds"],
    security: ["3d_secure", "fraud_detection", "pci_compliance"]
  },
  pricing: {
    components: ["daily_rate", "insurance", "extras", "taxes"],
    discounts: ["loyalty", "long_term", "seasonal", "promo_codes"],
    calculations: "transparent_breakdown"
  }
};
```

## Prompts de Conteúdo por Página

### Landing Pages Específicas

#### Página "Como Funciona"
```markdown
## Processo Simplificado em 3 Passos

### 1. Busque e Escolha
- Use nossos filtros inteligentes para encontrar o veículo ideal
- Compare preços, características e avaliações
- Veja fotos detalhadas e especificações completas

### 2. Reserve Online
- Selecione datas de retirada e devolução
- Escolha local de retirada ou solicite entrega
- Pague com segurança via cartão, PIX ou boleto

### 3. Retire e Dirija
- Apresente documentos no balcão ou use check-in digital
- Receba orientação completa sobre o veículo
- Aproveite sua viagem com total tranquilidade
```

#### Página de Preços
```jsx
const pricingTiers = [
  {
    name: "Básico",
    price: "R$ 299/mês",
    inclusions: ["10 diárias", "15% desconto extras", "Categorias econômica/sedan"],
    target: "Uso esporádico"
  },
  {
    name: "Profissional", 
    price: "R$ 599/mês",
    inclusions: ["20 diárias", "25% desconto extras", "Todas categorias", "Upgrades grátis"],
    target: "Uso regular",
    highlighted: true
  },
  {
    name: "Empresarial",
    price: "R$ 999/mês", 
    inclusions: ["40 diárias", "35% desconto extras", "Gerente dedicado", "Relatórios"],
    target: "Corporativo"
  }
];
```

### FAQ Dinâmico

```jsx
const faqSections = {
  reservas: [
    {
      q: "Como faço uma reserva?",
      a: "Acesse nosso site, busque por datas e local, escolha o veículo e finalize online."
    },
    {
      q: "Posso cancelar gratuitamente?",
      a: "Sim, cancelamento grátis até 24h antes da retirada."
    }
  ],
  documentos: [
    {
      q: "Quais documentos são necessários?",
      a: "CNH válida há mais de 2 anos, CPF e cartão de crédito."
    }
  ],
  pagamento: [
    {
      q: "Quais formas de pagamento aceitam?",
      a: "Cartão de crédito/débito, PIX, transferência e faturamento empresarial."
    }
  ]
};
```

## Prompts para Campanhas de Marketing

### Email Marketing

#### Bem-vindo
```
Assunto: 🚗 Bem-vindo à SISLOC! Sua primeira viagem com 20% OFF

Olá [NOME],

Seja bem-vindo à maior locadora digital do Brasil! 

Agora você tem acesso a:
✅ Mais de 500 veículos em 50+ cidades
✅ Preços transparentes sem taxas ocultas  
✅ Suporte 24/7 onde você estiver
✅ Programa de fidelidade exclusivo

Para começar com o pé direito, use o cupom BEMVINDO20 
e ganhe 20% OFF na sua primeira locação!

[BOTÃO: ENCONTRAR MEU CARRO]
```

#### Reengajamento
```
Assunto: Sentimos sua falta! 🚗 Volta que eu tenho uma surpresa

Oi [NOME],

Já faz um tempo que você não aluga com a gente...
Será que fizemos algo errado? 😅

Para te reconquistar, temos uma oferta especial:
🎁 30% OFF em qualquer categoria de veículo
🎁 Upgrade grátis (sujeito à disponibilidade)  
🎁 Check-in prioritário

Use o cupom VOLTAPORFAVOR30 até [DATA]

[BOTÃO: QUERO VOLTAR]
```

### Redes Sociais

#### Posts Instagram
```
Legenda para foto de SUV em paisagem:
"Fim de semana épico começa com o carro certo! 🏔️
Nosso SUV [MODELO] tem tudo que você precisa:
• 7 lugares para toda família
• Tração 4x4 para qualquer terreno  
• Tecnologia de ponta
• Seguro completo incluso

A partir de R$189/dia 💰
Reserve já! Link na bio 🔗

#SISLOC #AluguelDeCarros #FimDeSemana #Aventura #SUV"
```

#### Stories Sequence
```
Story 1: "Planejando uma viagem? 🗺️"
Story 2: "Nós temos o carro ideal! 🚗" 
Story 3: "Mais de 50 cidades disponíveis 📍"
Story 4: "Reserve em 2 cliques! 📱" [Link para site]
```

### Google Ads

#### Anúncios de Busca
```
Headline 1: Aluguel de Carros | A partir de R$89/dia
Headline 2: Frota Nova | Seguro Completo Incluso  
Headline 3: Reserve Online | Cancele Gratuitamente
Descrição: Locadora digital com os melhores preços. Mais de 500 veículos em 50+ cidades. Suporte 24h. Reserve agora!
```

#### Display
```
Título: Sua Próxima Viagem Começa Aqui
Subtítulo: Carros novos, preços justos, atendimento excepcional
CTA: Reserve Seu Carro
Imagem: Família feliz ao lado de SUV moderno
```

## Prompts para SEO e Conteúdo

### Blog Posts Ideas
```
1. "Guia Completo: Como Escolher o Carro Ideal para Sua Viagem"
2. "10 Destinos Incríveis para Explorar de Carro Alugado"  
3. "Economia vs Conforto: Qual Categoria de Carro Escolher?"
4. "Documentos Necessários para Alugar um Carro: Checklist Completo"
5. "Seguros de Veículo: Entenda as Coberturas e Proteja-se"
6. "Dicas de Direção Segura em Viagens Longas"
7. "Como Funciona o Programa de Fidelidade SISLOC"
8. "Carros Elétricos e Híbridos: O Futuro da Mobilidade"
```

### Meta Descriptions
```
Homepage: "Alugue carros com a SISLOC: frota moderna, preços transparentes e suporte 24h. Mais de 500 veículos em 50+ cidades. Reserve online!"

Busca de Veículos: "Encontre o carro perfeito para sua viagem. Compare preços, características e reserve online. Cancelamento grátis até 24h antes."

Portal Cliente: "Gerencie suas reservas, acumule pontos de fidelidade e acesse serviços exclusivos. Sua área personalizada na SISLOC."
```

## Implementação Técnica

### Componente de Busca Rápida
```jsx
const QuickSearch = () => {
  const [searchData, setSearchData] = useState({
    pickup_location: '',
    start_date: '',
    end_date: '',
    category: ''
  });

  return (
    <form className="bg-white rounded-2xl shadow-2xl p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        Reserve Agora
      </h3>
      
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Onde você quer retirar?"
          className="input w-full"
          value={searchData.pickup_location}
          onChange={(e) => setSearchData({...searchData, pickup_location: e.target.value})}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <input type="date" className="input w-full" />
          <input type="date" className="input w-full" />
        </div>
        
        <select className="input w-full">
          <option>Todas as categorias</option>
          <option value="compact">Compacto</option>
          <option value="sedan">Sedan</option>
          <option value="suv">SUV</option>
          <option value="luxury">Luxo</option>
        </select>
        
        <button className="btn btn-primary btn-lg w-full">
          Buscar Veículos
        </button>
      </div>
    </form>
  );
};
```

### Sistema de Avaliações
```jsx
const ReviewComponent = ({ vehicle }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  return (
    <div className="card p-6">
      <h4 className="font-bold mb-4">Avalie sua experiência</h4>
      
      <div className="flex items-center mb-4">
        {[1,2,3,4,5].map(star => (
          <Star 
            key={star}
            className={`h-6 w-6 cursor-pointer ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            onClick={() => setRating(star)}
          />
        ))}
      </div>
      
      <textarea 
        placeholder="Conte sobre sua experiência..."
        className="input w-full h-24 mb-4"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      
      <button className="btn btn-primary">
        Enviar Avaliação
      </button>
    </div>
  );
};
```

### Dashboard de Analytics
```jsx
const AdminDashboard = () => {
  const metrics = [
    { label: 'Receita Hoje', value: 'R$ 12.450', change: '+8.2%' },
    { label: 'Reservas Ativas', value: '156', change: '+12%' },
    { label: 'Taxa Ocupação', value: '87%', change: '+3.1%' },
    { label: 'NPS Score', value: '4.8', change: '+0.2' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map(metric => (
        <div key={metric.label} className="card p-6">
          <h3 className="text-sm font-medium text-gray-600">{metric.label}</h3>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold">{metric.value}</span>
            <span className="text-green-600 text-sm">{metric.change}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## Configuração de Deploy

### Variáveis de Ambiente para Produção
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/sisloc_prod
DB_USE_URL=true
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false

# Auth
JWT_SECRET=your-super-secret-jwt-key-here

# URLs
FRONTEND_URL=https://rent.cfauto.com.br
ADMIN_URL=https://rent.cfauto.com.br/admin
CORS_ORIGINS=https://rent.cfauto.com.br,https://rent.cfauto.com.br/admin

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@sisloc.com
SMTP_PASS=your-email-password
```

### Script de Deploy (.cpanel.yml)
```yaml
---
deployment:
  tasks:
    - export DEPLOYPATH=/home/username/public_html/rent.cfauto.com.br
    - cd $DEPLOYPATH/backend && npm ci --production
    - cd $DEPLOYPATH/frontend && npm ci && npm run build
    - cd $DEPLOYPATH/admin && npm ci && npm run build
    - cp -r $DEPLOYPATH/frontend/dist/* $DEPLOYPATH/backend/public/frontend/
    - cp -r $DEPLOYPATH/admin/dist/* $DEPLOYPATH/backend/public/admin/
    - touch $DEPLOYPATH/backend/tmp/restart.txt
```

---

*Este prompt técnico serve como guia de implementação para desenvolvedores trabalhando no sistema SISLOC, cobrindo desde componentes React até configurações de produção.*