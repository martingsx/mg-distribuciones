export interface Product {
  id: string;
  name: string;
  cost: number;
  margin: number;
  price: number;
  description: string;
  image_url: string;
  category: string;
  stock: number;
  tag?: 'Oferta' | 'Liquidación' | '';
  created_at?: string;
}

export type ProductInsert = Omit<Product, 'id' | 'created_at'>;
