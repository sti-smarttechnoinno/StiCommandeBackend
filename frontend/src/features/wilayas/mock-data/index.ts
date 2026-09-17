import type { WilayaRow, WilayasFilters, RegionId, WilayaPerformance, WilayaStatus } from '../types';

const REGION_MAP: Record<string, RegionId> = {
  'East': 'east', 'Est': 'east',
  'Center': 'center', 'Centre': 'center',
  'West': 'west', 'Ouest': 'west',
  'South': 'south', 'Sud': 'south',
};

const DELEGATE_NAMES = [
  'Ahmed Benali', 'Yacine B.', 'Amine K.', 'Sofiane M.', 'Rachid T.',
  'Karim A.', 'Mohamed S.', 'Omar F.', 'Ali B.', 'Youcef H.',
  'Abdelkader D.', 'Nassim G.', 'Farid L.', 'Samir Z.', 'Nadir P.',
  'Khaled M.', 'Reda A.', 'Tarek B.', 'Djamel E.', 'Hocine F.',
  'Mourad K.', 'Samir N.', 'Nabil R.', 'Othmane S.', 'Ismail T.',
  'Riyad B.', 'Zinedine D.', 'Madjid A.', 'Walid H.', 'Rachid B.',
  'Noureddine M.', 'Abdellah K.', 'Mohamed L.', 'Youssouf A.', 'Said B.',
  'Brahim F.', 'Hassan T.', 'Hamza E.',
];

const TOP_PRODUCTS = [
  'Mobilis SIM Card', 'Mobilis Credit 1000 DA', 'Ooredoo Data Pack 5GB',
  'Djezzy SIM Card', 'Mobilis Credit 2000 DA', 'Phone Case',
  'Charger Cable', 'Power Bank', 'Djezzy Scratch 500 DA', 'Ooredoo Credit 5000 DA',
];

const WILAYA_DATA: { name: string; code: string; region: string }[] = [
  { name: 'Sétif', code: '19', region: 'East' },
  { name: 'Alger', code: '16', region: 'Center' },
  { name: 'Oran', code: '31', region: 'West' },
  { name: 'Constantine', code: '25', region: 'East' },
  { name: 'Batna', code: '05', region: 'East' },
  { name: 'Annaba', code: '23', region: 'East' },
  { name: 'Blida', code: '09', region: 'Center' },
  { name: 'Tlemcen', code: '13', region: 'West' },
  { name: 'Béjaïa', code: '06', region: 'East' },
  { name: 'Sidi Bel Abbès', code: '22', region: 'West' },
  { name: 'Tizi Ouzou', code: '15', region: 'Center' },
  { name: 'Biskra', code: '07', region: 'South' },
  { name: 'Mascara', code: '29', region: 'West' },
  { name: 'Boumerdès', code: '35', region: 'Center' },
  { name: 'Skikda', code: '21', region: 'East' },
  { name: 'Chlef', code: '02', region: 'Center' },
  { name: 'Mostaganem', code: '27', region: 'West' },
  { name: 'Jijel', code: '18', region: 'East' },
  { name: 'Mila', code: '28', region: 'East' },
  { name: 'Tipaza', code: '42', region: 'Center' },
  { name: 'Médéa', code: '26', region: 'Center' },
  { name: 'Bouira', code: '10', region: 'Center' },
  { name: 'Djelfa', code: '17', region: 'South' },
  { name: "M'Sila", code: '28', region: 'Center' },
  { name: 'Guelma', code: '24', region: 'East' },
  { name: 'El Tarf', code: '36', region: 'East' },
  { name: 'Oum El Bouaghi', code: '04', region: 'East' },
  { name: 'Relizane', code: '48', region: 'West' },
  { name: 'Saïda', code: '20', region: 'West' },
  { name: 'Tiaret', code: '14', region: 'West' },
  { name: 'Souk Ahras', code: '41', region: 'East' },
  { name: 'Tébessa', code: '12', region: 'East' },
  { name: 'Bordj Bou Arréridj', code: '34', region: 'East' },
  { name: 'Khenchela', code: '40', region: 'East' },
  { name: "Aïn Témouchent", code: '46', region: 'West' },
  { name: 'Naâma', code: '45', region: 'West' },
  { name: 'Tissemsilt', code: '38', region: 'Center' },
  { name: "Aïn Defla", code: '44', region: 'Center' },
  { name: 'Laghouat', code: '03', region: 'South' },
  { name: 'Ouargla', code: '30', region: 'South' },
  { name: 'Ghardaïa', code: '47', region: 'South' },
  { name: 'El Oued', code: '39', region: 'South' },
  { name: 'Béchar', code: '08', region: 'South' },
  { name: 'Adrar', code: '01', region: 'South' },
  { name: 'Illizi', code: '33', region: 'South' },
  { name: 'Tamanrasset', code: '11', region: 'South' },
  { name: 'Tindouf', code: '37', region: 'South' },
  { name: 'Timimoun', code: '49', region: 'South' },
  { name: 'In Salah', code: '51', region: 'South' },
  { name: 'In Guezzam', code: '54', region: 'South' },
  { name: 'El Meniaa', code: '50', region: 'South' },
  { name: 'Touggourt', code: '52', region: 'South' },
  { name: "El M'Ghair", code: '53', region: 'South' },
  { name: "Ouled Djellal", code: '55', region: 'South' },
  { name: 'Béni Abbès', code: '56', region: 'South' },
  { name: 'Djanet', code: '57', region: 'South' },
  { name: 'Bordj Badji Mokhtar', code: '58', region: 'South' },
  { name: 'El Bayadh', code: '32', region: 'South' },
];

function generateTrend(base: number, variance: number, length: number): number[] {
  return Array.from({ length }, (_, i) => Math.max(0, base + Math.floor((Math.sin(i * 0.7) * variance) + (i * variance * 0.1))));
}

function getPerformance(score: number): WilayaPerformance {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 55) return 'average';
  return 'needs_attention';
}

function buildWilayaRows(): WilayaRow[] {
  return WILAYA_DATA.map((w, i) => {
    const regionId = REGION_MAP[w.region] || 'center';
    const baseRevenue = (30 - i) * 500000 + 2000000;
    const clients = Math.max(10, 200 - i * 5 + (i * 7) % 40);
    const ordersMonth = Math.floor(clients * (2.5 + (i % 5) * 0.3));
    const monthlyRevenue = baseRevenue + (i * 137000) % 5000000;
    const yearlyRevenue = monthlyRevenue * (10 + (i % 3));
    const avgOrder = Math.floor(monthlyRevenue / ordersMonth);
    const growth = -5 + (i * 7) % 40;
    const performanceScore = Math.max(30, 98 - i * 2 + (i * 3) % 15);
    const status: WilayaStatus = i < 40 ? 'active' : i < 50 ? 'limited' : 'inactive';
    const hasDelegate = i < 45 || Math.random() > 0.3;

    return {
      id: `wil-${i + 1}`,
      name: w.name,
      code: w.code,
      regionId,
      regionName: w.region,
      rank: i + 1,
      delegate: hasDelegate
        ? {
            name: DELEGATE_NAMES[i % DELEGATE_NAMES.length],
            phone: `+213 ${5 + (i % 4)}${String(10000000 + i * 137).slice(0, 8)}`,
            email: `${DELEGATE_NAMES[i % DELEGATE_NAMES.length].toLowerCase().replace(/\s+/g, '.')}@sti.dz`,
            avatar: DELEGATE_NAMES[i % DELEGATE_NAMES.length].split(' ').map(n => n[0]).join(''),
            isOnline: i % 3 !== 0,
            role: i % 5 === 0 ? 'Regional Delegate' : 'Area Delegate',
          }
        : null,
      clients,
      activeClients: Math.floor(clients * (0.7 + (i % 4) * 0.07)),
      ordersToday: Math.floor(ordersMonth / 30) + (i % 10),
      ordersMonth,
      monthlyRevenue,
      yearlyRevenue,
      avgOrder,
      growth,
      performance: getPerformance(performanceScore),
      performanceScore,
      topProduct: TOP_PRODUCTS[i % TOP_PRODUCTS.length],
      lastActivity: `${1 + (i * 11) % 23}h ago`,
      status,
      revenueTrend: generateTrend(monthlyRevenue / 1000000, 2, 12),
      ordersTrend: generateTrend(ordersMonth / 30, 5, 12),
    };
  });
}

export const mockWilayas: WilayaRow[] = buildWilayaRows();
