import type { Product, ProductCategory } from '@/types';

export type ProductStatus = 'active' | 'inactive' | 'draft' | 'low_stock' | 'out_of_stock';
export type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
export type ViewMode = 'table' | 'grid';
export type SortField = 'name' | 'sku' | 'category' | 'price' | 'stock' | 'status' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface ExtendedProduct extends Product {
  nominalPrice?: number;
  faceValue: number;
  discountPercent?: number;
  discountAmount?: number;
  sellingPrice: number;
  margin: number;
  profit: number;
  operator: string;
  barcode: string;
  reserved: number;
  warehouse: string;
  totalSold: number;
  revenue: number;
  region: string;
  updatedAt: string;
}

export interface ProductFilters {
  search: string;
  category: string[];
  operator: string[];
  stockStatus: StockFilter;
  productStatus: string[];
  region: string[];
  dateRange: { start: Date | null; end: Date | null };
}

export interface ProductsState {
  filters: ProductFilters;
  selectedIds: Set<string>;
  sort: { field: SortField; direction: SortDirection };
  page: number;
  pageSize: number;
  viewMode: ViewMode;
  selectedProduct: string | null;
  setFilter: <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => void;
  resetFilters: () => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  setSort: (field: SortField, direction: SortDirection) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedProduct: (id: string | null) => void;
}
