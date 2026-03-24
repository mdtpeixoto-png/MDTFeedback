export interface User {
  id: string;
  name: string;
  email: string;
  role: 'developer' | 'admin' | 'seller';
  avatar?: string;
}

export interface Sale {
  id: string;
  sellerId: string;
  sellerName: string;
  product: 'Claro' | 'Nio' | 'Giga Mais';
  plan: string;
  date: string;
  period: 'morning' | 'afternoon' | 'evening';
  value: number;
  week: number;
}

export interface CallFeedback {
  id: string;
  sellerId: string;
  sellerName: string;
  date: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  tone: 'positive' | 'neutral' | 'negative';
  tags: string[];
  score: number;
}

export interface IdleLog {
  sellerId: string;
  sellerName: string;
  date: string;
  totalIdleMinutes: number;
  idlePeriods: number;
  daysSinceLastSale: number;
}

export const mockUsers: User[] = [
  { id: '1', name: 'Carlos Silva', email: 'carlos@mdt.com', role: 'seller' },
  { id: '2', name: 'Ana Souza', email: 'ana@mdt.com', role: 'seller' },
  { id: '3', name: 'Pedro Lima', email: 'pedro@mdt.com', role: 'seller' },
  { id: '4', name: 'Mariana Costa', email: 'mariana@mdt.com', role: 'seller' },
  { id: '5', name: 'Lucas Oliveira', email: 'lucas@mdt.com', role: 'seller' },
  { id: '6', name: 'Juliana Santos', email: 'juliana@mdt.com', role: 'seller' },
  { id: '7', name: 'Fernanda Almeida', email: 'fernanda@mdt.com', role: 'seller' },
  { id: '8', name: 'Bruno Nascimento', email: 'bruno@mdt.com', role: 'seller' },
  { id: '9', name: 'Camila Ferreira', email: 'camila@mdt.com', role: 'seller' },
  { id: '10', name: 'Diego Barbosa', email: 'diego@mdt.com', role: 'seller' },
  { id: '11', name: 'Eduarda Rocha', email: 'eduarda@mdt.com', role: 'seller' },
  { id: '12', name: 'Felipe Cardoso', email: 'felipe@mdt.com', role: 'seller' },
  { id: '13', name: 'Gabriela Martins', email: 'gabriela@mdt.com', role: 'seller' },
  { id: '14', name: 'Henrique Moura', email: 'henrique@mdt.com', role: 'seller' },
  { id: '15', name: 'Isabela Teixeira', email: 'isabela@mdt.com', role: 'seller' },
  { id: '16', name: 'João Ribeiro', email: 'joao@mdt.com', role: 'seller' },
  { id: '17', name: 'Larissa Dias', email: 'larissa@mdt.com', role: 'seller' },
  { id: '18', name: 'Matheus Araújo', email: 'matheus@mdt.com', role: 'seller' },
  { id: '19', name: 'Natália Correia', email: 'natalia@mdt.com', role: 'seller' },
  { id: '20', name: 'Otávio Pereira', email: 'otavio@mdt.com', role: 'seller' },
  { id: '21', name: 'Rafael Mendes', email: 'rafael@mdt.com', role: 'admin' },
  { id: '22', name: 'Beatriz Lopes', email: 'beatriz@mdt.com', role: 'admin' },
  { id: '23', name: 'Dev Master', email: 'dev@mdt.com', role: 'developer' },
];

const sellerUsers = mockUsers.filter(u => u.role === 'seller');
const sellerCount = sellerUsers.length;

const products: Sale['product'][] = ['Claro', 'Nio', 'Giga Mais'];
const plans = ['250MB', '500MB', '1GB', '2GB', '5GB'];
const periods: Sale['period'][] = ['morning', 'afternoon', 'evening'];

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d.toISOString().split('T')[0];
}

function getWeekOfMonth(dateStr: string): number {
  const d = new Date(dateStr);
  const day = d.getDate();
  return Math.min(Math.ceil(day / 7), 4);
}

export const mockSales: Sale[] = Array.from({ length: 400 }, (_, i) => {
  const seller = sellerUsers[Math.floor(Math.random() * sellerCount)];
  const date = randomDate(60);
  return {
    id: `s${i}`,
    sellerId: seller.id,
    sellerName: seller.name,
    product: products[Math.floor(Math.random() * 3)],
    plan: plans[Math.floor(Math.random() * 5)],
    date,
    period: periods[Math.floor(Math.random() * 3)],
    value: Math.floor(Math.random() * 200) + 50,
    week: getWeekOfMonth(date),
  };
});

const strengthOptions = [
  'Boa abordagem inicial', 'Conhecimento do produto', 'Empatia com o cliente',
  'Fechamento assertivo', 'Boa dicção', 'Contorno de objeções eficaz',
];
const weaknessOptions = [
  'Demora no fechamento', 'Pouca insistência', 'Falta de urgência',
  'Não ofereceu upgrade', 'Tom monótono', 'Não validou dados',
];
const tagOptions = ['venda_rapida', 'upsell', 'reclamacao', 'cancelamento', 'retencao', 'novo_cliente'];

export const mockFeedbacks: CallFeedback[] = Array.from({ length: 250 }, (_, i) => {
  const seller = sellerUsers[Math.floor(Math.random() * sellerCount)];
  return {
    id: `f${i}`,
    sellerId: seller.id,
    sellerName: seller.name,
    date: randomDate(30),
    summary: `Ligação de ${Math.floor(Math.random() * 10) + 3} minutos. Cliente interessado em plano ${plans[Math.floor(Math.random() * 5)]}. ${Math.random() > 0.4 ? 'Venda concluída com sucesso.' : 'Cliente pediu para retornar.'}`,
    strengths: [...strengthOptions].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1),
    weaknesses: [...weaknessOptions].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 2) + 1),
    tone: (['positive', 'neutral', 'negative'] as const)[Math.floor(Math.random() * 3)],
    tags: [...tagOptions].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1),
    score: Math.floor(Math.random() * 40) + 60,
  };
});

export const mockIdleLogs: IdleLog[] = sellerUsers.map(u => ({
  sellerId: u.id,
  sellerName: u.name,
  date: new Date().toISOString().split('T')[0],
  totalIdleMinutes: Math.floor(Math.random() * 120) + 10,
  idlePeriods: Math.floor(Math.random() * 8) + 1,
  daysSinceLastSale: Math.floor(Math.random() * 5),
}));

// Computed metrics
export function getSalesBySeller(sellerId: string) {
  return mockSales.filter(s => s.sellerId === sellerId);
}

export function getSellerRanking() {
  return sellerUsers
    .map(s => ({
      ...s,
      totalSales: mockSales.filter(sale => sale.sellerId === s.id).length,
      totalValue: mockSales.filter(sale => sale.sellerId === s.id).reduce((sum, sale) => sum + sale.value, 0),
    }))
    .sort((a, b) => b.totalSales - a.totalSales);
}

export function getSalesByProduct() {
  return products.map(p => ({
    product: p,
    count: mockSales.filter(s => s.product === p).length,
  }));
}

export function getSalesByPeriod() {
  return periods.map(p => ({
    period: p === 'morning' ? 'Manhã' : p === 'afternoon' ? 'Tarde' : 'Noite',
    count: mockSales.filter(s => s.period === p).length,
  }));
}

export function getSalesByMonth() {
  const months: Record<string, number> = {};
  mockSales.forEach(s => {
    const month = s.date.substring(0, 7);
    months[month] = (months[month] || 0) + 1;
  });
  return Object.entries(months)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function getSellerPosition(sellerId: string): number {
  const ranking = getSellerRanking();
  return ranking.findIndex(r => r.id === sellerId) + 1;
}

export function getSalesByWeekAndPeriod() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthSales = mockSales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  return [1, 2, 3, 4].map(week => {
    const weekSales = currentMonthSales.filter(s => s.week === week);
    return {
      name: `Semana ${week}`,
      Manhã: weekSales.filter(s => s.period === 'morning').length,
      Tarde: weekSales.filter(s => s.period === 'afternoon').length,
      Noite: weekSales.filter(s => s.period === 'evening').length,
    };
  });
}

export function getAIMetrics() {
  const totalAnalyses = mockFeedbacks.length;
  const errorRate = 2.3;
  const tagDistribution = tagOptions.map(tag => ({
    tag,
    count: mockFeedbacks.filter(f => f.tags.includes(tag)).length,
  })).sort((a, b) => b.count - a.count);

  const recentFailures = [
    { id: 'ai1', date: '2026-03-20', type: 'Timeout', message: 'Resposta da IA excedeu 30s', endpoint: '/api/ai-feedback' },
    { id: 'ai2', date: '2026-03-19', type: 'Parse Error', message: 'Formato de resposta inválido', endpoint: '/api/ai-feedback' },
    { id: 'ai3', date: '2026-03-18', type: 'Rate Limit', message: 'Limite de requisições atingido', endpoint: '/api/ai-feedback' },
    { id: 'ai4', date: '2026-03-17', type: 'Timeout', message: 'Conexão com modelo perdida', endpoint: '/api/ai-analysis' },
  ];

  return { totalAnalyses, errorRate, tagDistribution, recentFailures };
}
