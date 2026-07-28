import { api } from './api';
import type { Product, ProductPayload } from '../types/product';

export async function listProducts(shelfId?: string): Promise<Product[]> {
  const params = shelfId ? { shelf_id: shelfId } : undefined;
  const response = await api.get<Product[]>('/products', { params });
  return response.data;
}

export async function getProduct(productId: string): Promise<Product> {
  const response = await api.get<Product>(`/products/${productId}`);
  return response.data;
}

export async function createProduct(shelfId: string, payload: ProductPayload): Promise<Product> {
  const response = await api.post<Product>('/products', payload, { params: { shelf_id: shelfId } });
  return response.data;
}

export async function updateProduct(productId: string, payload: Partial<ProductPayload>): Promise<Product> {
  const response = await api.put<Product>(`/products/${productId}`, payload);
  return response.data;
}

export async function deleteProduct(productId: string): Promise<void> {
  await api.delete(`/products/${productId}`);
}
