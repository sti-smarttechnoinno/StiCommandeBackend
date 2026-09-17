import type { RegionData, Wilaya, RegionId, WilayaStatus } from '../types';

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

function generateDelegate(index: number, online: boolean) {
  const name = DELEGATE_NAMES[index % DELEGATE_NAMES.length];
  return {
    id: `del-${index + 1}`,
    name,
    phone: `+213 ${5 + (index % 4)}${String(10000000 + index * 137).slice(0, 8)}`,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@sti.dz`,
    avatar: name.split(' ').map(n => n[0]).join(''),
    isOnline: online,
    role: index % 5 === 0 ? 'Regional Delegate' : 'Area Delegate',
  };
}

const EAST_WILAYAS: { name: string; code: string }[] = [
  { name: 'Sétif', code: '19' },
  { name: 'Constantine', code: '25' },
  { name: 'Batna', code: '05' },
  { name: 'Béjaïa', code: '06' },
  { name: 'Jijel', code: '18' },
  { name: 'Mila', code: '28' },
  { name: 'Skikda', code: '21' },
  { name: 'Annaba', code: '23' },
  { name: 'Guelma', code: '24' },
  { name: 'El Tarf', code: '36' },
  { name: 'Oum El Bouaghi', code: '04' },
  { name: 'Souk Ahras', code: '41' },
  { name: 'Tébessa', code: '12' },
  { name: 'Bordj Bou Arréridj', code: '34' },
  { name: 'Khenchela', code: '40' },
];

const CENTER_WILAYAS: { name: string; code: string }[] = [
  { name: 'Alger', code: '16' },
  { name: 'Blida', code: '09' },
  { name: 'Boumerdès', code: '35' },
  { name: 'Tipaza', code: '42' },
  { name: 'Tizi Ouzou', code: '15' },
  { name: 'Bouira', code: '10' },
  { name: 'Médéa', code: '26' },
  { name: 'Chlef', code: '02' },
  { name: 'Djelfa', code: '17' },
  { name: "M'Sila", code: '28' },
  { name: 'Tissemsilt', code: '38' },
  { name: "Aïn Defla", code: '44' },
  { name: 'Laghouat', code: '03' },
];

const WEST_WILAYAS: { name: string; code: string }[] = [
  { name: 'Oran', code: '31' },
  { name: 'Tlemcen', code: '13' },
  { name: 'Sidi Bel Abbès', code: '22' },
  { name: 'Mostaganem', code: '27' },
  { name: 'Mascara', code: '29' },
  { name: 'Relizane', code: '48' },
  { name: "Aïn Témouchent", code: '46' },
  { name: 'Saïda', code: '20' },
  { name: 'Naâma', code: '45' },
  { name: 'Tiaret', code: '14' },
];

const SOUTH_WILAYAS: { name: string; code: string }[] = [
  { name: 'Ouargla', code: '30' },
  { name: 'Ghardaïa', code: '47' },
  { name: 'El Oued', code: '39' },
  { name: 'Biskra', code: '07' },
  { name: 'Béchar', code: '08' },
  { name: 'Adrar', code: '01' },
  { name: 'Illizi', code: '33' },
  { name: 'Tamanrasset', code: '11' },
  { name: 'Tindouf', code: '37' },
  { name: 'Timimoun', code: '49' },
  { name: 'In Salah', code: '51' },
  { name: 'In Guezzam', code: '54' },
  { name: 'El Meniaa', code: '50' },
  { name: 'Touggourt', code: '52' },
  { name: "El M'Ghair", code: '53' },
  { name: "Ouled Djellal", code: '55' },
  { name: 'Béni Abbès', code: '56' },
  { name: 'Djanet', code: '57' },
  { name: 'Bordj Badji Mokhtar', code: '58' },
  { name: 'El Bayadh', code: '32' },
];

function generateWilayas(
  wilayaList: { name: string; code: string }[],
  regionId: RegionId,
  regionName: string,
  startIndex: number
): Wilaya[] {
  return wilayaList.map((w, i) => {
    const idx = startIndex + i;
    const hasDelegate = i < wilayaList.length - 1 || Math.random() > 0.3;
    const statuses: WilayaStatus[] = ['active', 'active', 'active', 'limited', 'inactive'];
    const status = i < 3 ? 'active' : statuses[idx % statuses.length];
    return {
      id: `wil-${regionId}-${i + 1}`,
      name: w.name,
      code: w.code,
      regionId,
      regionName,
      delegate: hasDelegate ? generateDelegate(idx, i % 3 !== 0) : null,
      clients: 20 + (idx * 37) % 180,
      ordersToday: 5 + (idx * 19) % 65,
      revenue: (1 + (idx * 7) % 30) * 1000000,
      coverage: status === 'inactive' ? 0 : 70 + (idx * 13) % 30,
      status,
      lastActivity: `${1 + (idx * 11) % 23}h ago`,
    };
  });
}

function buildRegions(): RegionData[] {
  const eastWilayas = generateWilayas(EAST_WILAYAS, 'east', 'East', 0);
  const centerWilayas = generateWilayas(CENTER_WILAYAS, 'center', 'Center', 15);
  const westWilayas = generateWilayas(WEST_WILAYAS, 'west', 'west', 28);
  const southWilayas = generateWilayas(SOUTH_WILAYAS, 'south', 'South', 38);

  const sumField = (wilayas: Wilaya[], key: keyof Wilaya) =>
    wilayas.reduce((s, w) => s + (w[key] as number), 0);

  return [
    {
      id: 'east',
      name: 'East',
      nameFr: 'Est',
      subtitle: 'Eastern Algeria Distribution Zone',
      icon: '🗺️',
      color: '#2563EB',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-600',
      wilayas: eastWilayas,
      delegates: 12,
      clients: sumField(eastWilayas, 'clients'),
      ordersToday: sumField(eastWilayas, 'ordersToday'),
      revenue: sumField(eastWilayas, 'revenue'),
    },
    {
      id: 'center',
      name: 'Center',
      nameFr: 'Centre',
      subtitle: 'Central Algeria Distribution Zone',
      icon: '🏛️',
      color: '#D71920',
      bgColor: 'bg-primary/10',
      textColor: 'text-primary',
      wilayas: centerWilayas,
      delegates: 10,
      clients: sumField(centerWilayas, 'clients'),
      ordersToday: sumField(centerWilayas, 'ordersToday'),
      revenue: sumField(centerWilayas, 'revenue'),
    },
    {
      id: 'west',
      name: 'West',
      nameFr: 'Ouest',
      subtitle: 'Western Algeria Distribution Zone',
      icon: '🌊',
      color: '#22C55E',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-600',
      wilayas: westWilayas,
      delegates: 8,
      clients: sumField(westWilayas, 'clients'),
      ordersToday: sumField(westWilayas, 'ordersToday'),
      revenue: sumField(westWilayas, 'revenue'),
    },
    {
      id: 'south',
      name: 'South',
      nameFr: 'Sud',
      subtitle: 'Southern Algeria Distribution Zone',
      icon: '🏜️',
      color: '#F59E0B',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-600',
      wilayas: southWilayas,
      delegates: 8,
      clients: sumField(southWilayas, 'clients'),
      ordersToday: sumField(southWilayas, 'ordersToday'),
      revenue: sumField(southWilayas, 'revenue'),
    },
  ];
}

export const mockRegions: RegionData[] = buildRegions();
export const mockAllWilayas: Wilaya[] = mockRegions.flatMap((r) => r.wilayas);
