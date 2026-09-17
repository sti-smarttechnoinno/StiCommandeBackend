import api from './api';

export interface ProductData {
  id: string;
  sku: string;
  code: string;
  name: string;
  barcode: string;
  category: string;
  operator: string;
  nominalPrice: number;
  price: number;
  faceValue: number;
  discountPercent: number;
  discountAmount: number;
  sellingPrice: number;
  stock?: number | null;
  stockQuantity?: number | null;
  minStock?: number | null;
  trackStock?: boolean;
  status: 'active' | 'low_stock' | 'draft' | 'out_of_stock' | 'inactive';
  reserved: number;
  warehouse: string;
  totalSold: number;
  revenue: number;
  region: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  data: ProductData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductKpisResponse {
  totalProducts: number;
  activeProducts: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  catalogValue: number;
  trends: {
    totalProducts: number;
    activeProducts: number;
    totalStock: number;
    catalogValue: number;
  };
}

export interface ProductAnalyticsResponse {
  operatorDistribution: { name: string; value: number }[];
  categoryDistribution: { name: string; value: number }[];
  stockOverview: { status: string; count: number }[];
}

export interface ProductsParams {
  search?: string;
  category?: string[];
  operator?: string[];
  stockStatus?: string;
  productStatus?: string[];
  dateStart?: string;
  dateEnd?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const productsService = {
  async list(params: ProductsParams = {}): Promise<ProductsResponse> {
    const query: Record<string, string | string[] | number> = {};

    if (params.search) query.search = params.search;
    if (params.category?.length) query.category = params.category;
    if (params.operator?.length) query.operator = params.operator;
    if (params.stockStatus && params.stockStatus !== 'all') query.stockStatus = params.stockStatus;
    if (params.productStatus?.length) query.productStatus = params.productStatus;
    if (params.dateStart) query.dateStart = params.dateStart;
    if (params.dateEnd) query.dateEnd = params.dateEnd;
    if (params.sortField) query.sortField = params.sortField;
    if (params.sortDirection) query.sortDirection = params.sortDirection;
    if (params.page) query.page = params.page;
    if (params.pageSize) query.pageSize = params.pageSize;

    const { data } = await api.get<ProductsResponse>('/products', { params: query });
    return data;
  },

  async getKpis(): Promise<ProductKpisResponse> {
    const { data } = await api.get<ProductKpisResponse>('/products/kpis');
    return data;
  },

  async getAnalytics(): Promise<ProductAnalyticsResponse> {
    const { data } = await api.get<ProductAnalyticsResponse>('/products/analytics');
    return data;
  },

  async get(id: string): Promise<ProductData> {
    const { data } = await api.get<{ data: ProductData }>(`/products/${id}`);
    return data.data;
  },

  async create(product: Partial<ProductData>): Promise<ProductData> {
    const payload = {
      ...product,
      nominal_price: product.nominalPrice ?? product.price,
      discount_percent: product.discountPercent,
      stock_quantity: product.stockQuantity ?? product.stock,
      min_stock: product.minStock,
    };
    const { data } = await api.post<{ data: ProductData }>('/products', payload);
    return data.data;
  },

  async update(id: string, product: Partial<ProductData>): Promise<ProductData> {
    const payload = {
      ...product,
      nominal_price: product.nominalPrice ?? product.price,
      discount_percent: product.discountPercent,
      stock_quantity: product.stockQuantity ?? product.stock,
      min_stock: product.minStock,
    };
    const { data } = await api.put<{ data: ProductData }>(`/products/${id}`, payload);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  async bulkAction(ids: string[], action: 'activate' | 'deactivate' | 'delete'): Promise<void> {
    await api.post('/products/bulk', { ids, action });
  },
};
