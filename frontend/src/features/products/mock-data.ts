import type { ExtendedProduct } from './types';

const OPERATORS = ['Mobilis', 'Ooredoo', 'Djezzy'];
const CATEGORIES = ['mobile_credit', 'sim_cards', 'scratch_cards', 'accessories', 'data_packs', 'voice_packages', 'sms_packages'];
const REGIONS = ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Batna', 'Sétif', 'Blida', 'Tizi Ouzou', 'Biskra', 'Tlemcen'];

const PRODUCT_TEMPLATES: { name: string; category: string; faceValue: number; operator: string; sku: string }[] = [
  { name: 'Mobilis Credit 500 DA', category: 'mobile_credit', faceValue: 500, operator: 'Mobilis', sku: 'MOB-0500' },
  { name: 'Mobilis Credit 1000 DA', category: 'mobile_credit', faceValue: 1000, operator: 'Mobilis', sku: 'MOB-1000' },
  { name: 'Mobilis Credit 2000 DA', category: 'mobile_credit', faceValue: 2000, operator: 'Mobilis', sku: 'MOB-2000' },
  { name: 'Mobilis Credit 5000 DA', category: 'mobile_credit', faceValue: 5000, operator: 'Mobilis', sku: 'MOB-5000' },
  { name: 'Ooredoo Credit 500 DA', category: 'mobile_credit', faceValue: 500, operator: 'Ooredoo', sku: 'OOR-0500' },
  { name: 'Ooredoo Credit 1000 DA', category: 'mobile_credit', faceValue: 1000, operator: 'Ooredoo', sku: 'OOR-1000' },
  { name: 'Ooredoo Credit 2000 DA', category: 'mobile_credit', faceValue: 2000, operator: 'Ooredoo', sku: 'OOR-2000' },
  { name: 'Ooredoo Credit 5000 DA', category: 'mobile_credit', faceValue: 5000, operator: 'Ooredoo', sku: 'OOR-5000' },
  { name: 'Djezzy Credit 500 DA', category: 'mobile_credit', faceValue: 500, operator: 'Djezzy', sku: 'DJZ-0500' },
  { name: 'Djezzy Credit 1000 DA', category: 'mobile_credit', faceValue: 1000, operator: 'Djezzy', sku: 'DJZ-1000' },
  { name: 'Djezzy Credit 2000 DA', category: 'mobile_credit', faceValue: 2000, operator: 'Djezzy', sku: 'DJZ-2000' },
  { name: 'Djezzy Credit 5000 DA', category: 'mobile_credit', faceValue: 5000, operator: 'Djezzy', sku: 'DJZ-5000' },
  { name: 'Mobilis SIM Prepaid', category: 'sim_cards', faceValue: 500, operator: 'Mobilis', sku: 'SIM-MOB-PRE' },
  { name: 'Mobilis SIM Postpaid', category: 'sim_cards', faceValue: 1000, operator: 'Mobilis', sku: 'SIM-MOB-POS' },
  { name: 'Mobilis 4G SIM', category: 'sim_cards', faceValue: 1500, operator: 'Mobilis', sku: 'SIM-MOB-4G' },
  { name: 'Ooredoo SIM Prepaid', category: 'sim_cards', faceValue: 500, operator: 'Ooredoo', sku: 'SIM-OOR-PRE' },
  { name: 'Ooredoo SIM Postpaid', category: 'sim_cards', faceValue: 1000, operator: 'Ooredoo', sku: 'SIM-OOR-POS' },
  { name: 'Ooredoo 4G SIM', category: 'sim_cards', faceValue: 1500, operator: 'Ooredoo', sku: 'SIM-OOR-4G' },
  { name: 'Djezzy SIM Prepaid', category: 'sim_cards', faceValue: 500, operator: 'Djezzy', sku: 'SIM-DJZ-PRE' },
  { name: 'Djezzy SIM Postpaid', category: 'sim_cards', faceValue: 1000, operator: 'Djezzy', sku: 'SIM-DJZ-POS' },
  { name: 'Djezzy 4G SIM', category: 'sim_cards', faceValue: 1500, operator: 'Djezzy', sku: 'SIM-DJZ-4G' },
  { name: 'Mobilis Scratch 500 DA', category: 'scratch_cards', faceValue: 500, operator: 'Mobilis', sku: 'SCR-MOB-0500' },
  { name: 'Mobilis Scratch 1000 DA', category: 'scratch_cards', faceValue: 1000, operator: 'Mobilis', sku: 'SCR-MOB-1000' },
  { name: 'Ooredoo Scratch 500 DA', category: 'scratch_cards', faceValue: 500, operator: 'Ooredoo', sku: 'SCR-OOR-0500' },
  { name: 'Ooredoo Scratch 1000 DA', category: 'scratch_cards', faceValue: 1000, operator: 'Ooredoo', sku: 'SCR-OOR-1000' },
  { name: 'Phone Case Universal', category: 'accessories', faceValue: 0, operator: '-', sku: 'ACC-CASE-01' },
  { name: 'Screen Protector 6.1"', category: 'accessories', faceValue: 0, operator: '-', sku: 'ACC-SCRP-01' },
  { name: 'USB-C Charger Cable', category: 'accessories', faceValue: 0, operator: '-', sku: 'ACC-CHRG-01' },
  { name: 'Power Bank 10000mAh', category: 'accessories', faceValue: 0, operator: '-', sku: 'ACC-PWRB-01' },
  { name: 'Mobilis Data Pack 5GB', category: 'data_packs', faceValue: 1500, operator: 'Mobilis', sku: 'DAT-MOB-5G' },
  { name: 'Mobilis Data Pack 10GB', category: 'data_packs', faceValue: 2500, operator: 'Mobilis', sku: 'DAT-MOB-10G' },
  { name: 'Ooredoo Data Pack 5GB', category: 'data_packs', faceValue: 1500, operator: 'Ooredoo', sku: 'DAT-OOR-5G' },
  { name: 'Ooredoo Data Pack 10GB', category: 'data_packs', faceValue: 2500, operator: 'Ooredoo', sku: 'DAT-OOR-10G' },
  { name: 'Djezzy Data Pack 5GB', category: 'data_packs', faceValue: 1500, operator: 'Djezzy', sku: 'DAT-DJZ-5G' },
  { name: 'Djezzy Data Pack 10GB', category: 'data_packs', faceValue: 2500, operator: 'Djezzy', sku: 'DAT-DJZ-10G' },
  { name: 'Mobilis Voice Pack 60min', category: 'voice_packages', faceValue: 800, operator: 'Mobilis', sku: 'VOI-MOB-60' },
  { name: 'Ooredoo Voice Pack 60min', category: 'voice_packages', faceValue: 800, operator: 'Ooredoo', sku: 'VOI-OOR-60' },
  { name: 'Mobilis SMS Pack 100', category: 'sms_packages', faceValue: 300, operator: 'Mobilis', sku: 'SMS-MOB-100' },
  { name: 'Ooredoo SMS Pack 100', category: 'sms_packages', faceValue: 300, operator: 'Ooredoo', sku: 'SMS-OOR-100' },
];

function generateProducts(count: number): ExtendedProduct[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const template = PRODUCT_TEMPLATES[i % PRODUCT_TEMPLATES.length];
    const margin = 3 + (i % 8);
    const sellingPrice = Math.round(template.faceValue * (1 + margin / 100));
    const profit = sellingPrice - template.faceValue;
    const stock = i % 13 === 0 ? 0 : 100 + (i * 37) % 15000;
    const minStock = 20 + (i % 5) * 10;
    const daysAgo = i % 30;
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - (90 + i * 3));

    return {
      id: `prod-${i + 1}`,
      name: template.name,
      sku: template.sku,
      category: template.category as any,
      price: template.faceValue,
      stock,
      minStock,
      description: `${template.name} - Telecom product`,
      status: stock === 0 ? 'inactive' : stock < minStock ? 'active' : 'active',
      faceValue: template.faceValue,
      nominalPrice: template.faceValue,
      discountPercent: 0,
      discountAmount: 0,
      sellingPrice: template.faceValue > 0 ? sellingPrice : 0,
      margin: template.faceValue > 0 ? margin : 0,
      profit: template.faceValue > 0 ? profit : 0,
      operator: template.operator,
      barcode: `6${String(250000000 + i).padStart(12, '0')}`,
      reserved: Math.floor(stock * 0.05),
      warehouse: i % 3 === 0 ? 'Secondary Warehouse' : 'Main Warehouse',
      totalSold: 50 + (i * 19) % 2000,
      revenue: (50 + (i * 19) % 2000) * sellingPrice,
      region: REGIONS[i % REGIONS.length],
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
    };
  });
}

export const mockProducts: ExtendedProduct[] = [];
