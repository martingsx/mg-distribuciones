import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../services/productService';
import type { Product } from '../types/product';
import { Navbar } from '../components/layout/Navbar';
import { useCart } from '../context/CartContext';
import { 
  Truck, ArrowLeft, Loader2, ShoppingCart, 
  ShieldCheck, RotateCcw, Award 
} from 'lucide-react';

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!id) return;
    productService.getProductById(id)
      .then(setProduct)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40">
           <Loader2 className="animate-spin text-blue-600 w-12 h-12" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <Navbar />
        <div className="text-center py-40">
           <h2 className="text-2xl font-black uppercase tracking-widest text-gray-800">Producto no encontrado</h2>
           <Link to="/" className="text-blue-600 font-bold mt-4 inline-block hover:underline">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 font-black uppercase text-[10px] tracking-widest mb-8 transition-all">
           <ArrowLeft size={16} /> Volver
        </Link>

        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
           <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Image Section */}
              <div className="p-10 border-r border-gray-50 flex items-center justify-center bg-white relative">
                  {product.tag && (
                    <span className={`absolute top-10 left-10 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${
                      product.tag === 'Oferta' ? 'bg-green-100 text-green-600 shadow-green-200/50' : 'bg-orange-100 text-orange-600 shadow-orange-200/50'
                    }`}>
                      {product.tag}
                    </span>
                  )}
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="max-h-[500px] w-full object-contain transform hover:scale-105 transition-transform duration-500" 
                  />
              </div>

              {/* Info Section */}
              <div className="p-10 lg:p-20 space-y-10">
                 <div className="space-y-4">
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">{product.category}</span>
                    <h1 className="text-4xl lg:text-5xl font-black text-gray-900 leading-none tracking-tighter italic">{product.name}</h1>
                    <div className="flex items-center gap-2 text-orange-400">
                       {Array.from({ length: 5 }).map((_, i) => <Award key={i} size={16} fill="currentColor" />)}
                       <span className="text-xs font-bold text-gray-400 ml-2">Producto Recomendado</span>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <p className="text-gray-400 text-sm font-bold line-through">$ {(product.price * 1.2).toLocaleString('es-AR')}</p>
                    <h2 className="text-6xl font-black text-gray-900 tracking-tighter">$ {product.price.toLocaleString('es-AR')}</h2>
                    <p className="text-green-600 text-sm font-black uppercase tracking-widest">Ahorrás el 20% hoy</p>
                 </div>

                 <div className="bg-blue-50/50 p-6 rounded-3xl space-y-4 border border-blue-50">
                    <div className="flex gap-4">
                       <Truck className="text-blue-500 shrink-0" />
                       <div>
                          <p className="text-sm font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Envío gratis a todo el país</p>
                          <p className="text-xs text-blue-400 font-bold">Llega entre mañana y el miércoles</p>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4 pt-4">
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-5 font-black uppercase text-xs tracking-[.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                       <ShoppingCart size={18} /> Agregar al Carrito
                    </button>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                          <ShieldCheck size={20} className="text-gray-400" />
                          <span className="text-[9px] font-black uppercase text-gray-500 leading-tight">Compra<br/>Protegida</span>
                       </div>
                       <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                          <RotateCcw size={20} className="text-gray-400" />
                          <span className="text-[9px] font-black uppercase text-gray-500 leading-tight">Devolución<br/>Gratis</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Description Bar */}
           <div className="bg-gray-50/50 border-t border-gray-100 p-10 lg:p-20">
              <h3 className="text-xl font-black uppercase tracking-tighter italic mb-6">Descripción del Producto</h3>
              <p className="text-gray-500 font-bold text-lg leading-relaxed whitespace-pre-line">
                {product.description || `Este ${product.name} es parte de nuestra línea seleccionada de ${product.category}. Ideal para profesionales y comercio mayorista.`}
              </p>
           </div>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
        .font-sans { font-family: 'Outfit', sans-serif; }
      `}</style>
    </div>
  );
};
