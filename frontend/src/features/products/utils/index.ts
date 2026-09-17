import type { ExtendedProduct, ProductFilters } from '../types';

export function filterProducts(products: ExtendedProduct[], filters: ProductFilters): ExtendedProduct[] {
  return products.filter((product) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        product.name.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        product.barcode.includes(q) ||
        product.operator.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filters.category.length > 0 && !filters.category.includes(product.category)) return false;
    if (filters.operator.length > 0 && !filters.operator.includes(product.operator)) return false;
    if (filters.productStatus.length > 0 && !filters.productStatus.includes(product.status)) return false;
    if (filters.region.length > 0 && !filters.region.includes(product.region)) return false;

    if (filters.stockStatus !== 'all') {
      if (filters.stockStatus === 'out_of_stock' && product.stock > 0) return false;
      if (filters.stockStatus === 'low_stock' && (product.stock === 0 || product.stock >= product.minStock)) return false;
      if (filters.stockStatus === 'in_stock' && product.stock === 0) return false;
    }

    if (filters.dateRange.start) {
      const productDate = new Date(product.createdAt);
      if (productDate < filters.dateRange.start) return false;
    }
    if (filters.dateRange.end) {
      const productDate = new Date(product.createdAt);
      const end = new Date(filters.dateRange.end);
      end.setHours(23, 59, 59, 999);
      if (productDate > end) return false;
    }

    return true;
  });
}

export function sortProducts(
  products: ExtendedProduct[],
  field: string,
  direction: 'asc' | 'desc'
): ExtendedProduct[] {
  return [...products].sort((a, b) => {
    let comparison = 0;
    switch (field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'sku':
        comparison = a.sku.localeCompare(b.sku);
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'price':
        comparison = a.sellingPrice - b.sellingPrice;
        break;
      case 'stock':
        comparison = a.stock - b.stock;
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      default:
        comparison = 0;
    }
    return direction === 'asc' ? comparison : -comparison;
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' DA';
}

export function formatFullCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' DA';
}

export function formatCompactCurrency(amount: number): string {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M DA';
  if (amount >= 1000) return (amount / 1000).toFixed(0) + 'K DA';
  return amount.toLocaleString('en-US') + ' DA';
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getStockColor(stock: number, minStock: number): string {
  if (stock === 0) return 'text-rose-600 dark:text-rose-400';
  if (stock < minStock) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

export function getStockBarColor(stock: number, minStock: number): string {
  if (stock === 0) return 'bg-rose-500';
  if (stock < minStock) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function getMarginColor(margin: number): string {
  if (margin >= 5) return 'text-emerald-600 dark:text-emerald-400';
  if (margin >= 3) return 'text-blue-600 dark:text-blue-400';
  return 'text-amber-600 dark:text-amber-400';
}
