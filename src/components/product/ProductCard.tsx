import { Link } from 'react-router-dom';
import type { Product } from '../../types/product';
import { Truck } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Link to={`/product/${product.id}`} className="bg-white rounded-[24px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-blue-100 flex flex-col h-full">
      <div className="aspect-square bg-white flex items-center justify-center overflow-hidden relative">
        {product.tag && (
          <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest z-10 shadow-lg ${
            product.tag === 'Oferta' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
          }`}>
            {product.tag}
          </span>
        )}
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-6 border-t border-gray-50 flex-1 flex flex-col">
        <div className="flex flex-col gap-1 mb-4 flex-1">
          <span className="text-2xl font-black text-gray-900 tracking-tighter">
            $ {product.price.toLocaleString('es-AR')}
          </span>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-tight line-clamp-2 leading-relaxed h-8 group-hover:text-blue-500 transition-colors">
            {product.name}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 pt-4 border-t border-gray-50">
          <Truck className="h-4 w-4 text-green-500" />
          <span className="text-[9px] font-black uppercase text-green-500 tracking-widest">Envío gratis</span>
        </div>
      </div>
    </Link>
  );
};
