export interface Product {
  id: string;
  shelf_id: string;
  product_name: string;
  sku: string;
  category: string | null;
  price: number | null;
  created_at: string;
}

export interface ProductPayload {
  product_name: string;
  sku: string;
  category?: string | null;
  price?: number | null;
}
