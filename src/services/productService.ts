import { supabase } from './supabaseClient';
import type { Product, ProductInsert } from '../types/product';

export interface Category {
  id: string;
  name: string;
}

export const productService = {
  // PRODUCTS
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Product[];
  },

  async getProductById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Product;
  },

  async searchProducts(query: string, page: number = 1, pageSize: number = 20, category?: string, tag?: string) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let supabaseQuery = supabase
      .from('products')
      .select('*', { count: 'exact' });

    if (query) {
      const keywords = query.trim().split(/\s+/);
      keywords.forEach(word => {
        supabaseQuery = supabaseQuery.ilike('name', `%${word}%`);
      });
    }

    if (category) {
      supabaseQuery = supabaseQuery.eq('category', category);
    }

    if (tag) {
      supabaseQuery = supabaseQuery.eq('tag', tag);
    }

    const { data, error, count } = await supabaseQuery
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return {
      products: data as Product[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  },

  async createProduct(product: ProductInsert) {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    
    if (error) throw error;
    return data as Product;
  },

  async updateProduct(id: string, updates: Partial<ProductInsert>) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Product;
  },

  async deleteProduct(id: string) {
    // 1. Get the image URL first
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('image_url')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching product before deletion:", fetchError);
    }

    const imageUrl = product?.image_url;

    console.log("Iniciando borrado de producto en DB con ID:", id);

    // 2. Delete from database
    const { data: deletedRows, error: dbError } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select();
    
    if (dbError) {
      console.error("Error de Supabase al borrar en DB:", dbError);
      throw dbError;
    }

    if (!deletedRows || deletedRows.length === 0) {
      console.warn("No se encontró ningún producto con ese ID para borrar (0 filas afectadas)");
    } else {
      console.log("Producto eliminado correctamente de la DB:", deletedRows[0].name);
    }

    // 3. Clean up storage if image exists
    if (imageUrl) {
      try {
        console.log("URL de imagen recuperada:", imageUrl);
        
        // Extract the path after /public/products/
        // Example URL: https://[project].supabase.co/storage/v1/object/public/products/product-images/0.123.jpg
        const bucketName = 'products';
        const publicUrlSegment = `/storage/v1/object/public/${bucketName}/`;
        let idx = imageUrl.indexOf(publicUrlSegment);
        
        // Secondary attempt if the first segment doesn't match
        if (idx === -1) {
          const fallbackSegment = `/${bucketName}/`;
          idx = imageUrl.indexOf(fallbackSegment);
        }

        if (idx !== -1) {
          // Special case: we need EVERYTHING after the bucket name segment
          // We look for the last occurrence of bucketName/ if needed, but let's be more precise
          const searchFor = `/${bucketName}/`;
          const pathIdx = imageUrl.indexOf(searchFor) + searchFor.length;
          const pathWithQuery = imageUrl.substring(pathIdx);
          const path = decodeURIComponent(pathWithQuery.split('?')[0]);
          
          console.log("Intentando borrar archivo en bucket 'products' con ruta:", path);
          
          const { data: removedData, error: storageError } = await supabase.storage
            .from(bucketName)
            .remove([path]);
            
          if (storageError) {
            console.error("Error de Supabase al borrar archivo en storage:", storageError);
          } else if (removedData && removedData.length > 0) {
            console.log("¡ÉXITO! Imagen borrada físicamente del storage:", removedData);
          } else {
            console.warn("ATENCIÓN: Supabase no encontró el archivo para borrar en esa ruta:", path);
            console.log("Información devuelta por Supabase:", removedData);
          }
        } else {
          console.warn("No se pudo identificar la ruta del bucket en la URL:", imageUrl);
        }
      } catch (e) {
        console.error("Fallo crítico en limpieza de storage:", e);
      }
    }
  },

  // CATEGORIES
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data as Category[];
  },

  async createCategory(name: string) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name })
      .select()
      .single();
    
    if (error) throw error;
    return data as Category;
  },

  async deleteCategory(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // STORAGE
  async uploadProductImage(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `product-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};
