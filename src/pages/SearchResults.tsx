import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productService } from '../services/productService';
import type { Product } from '../types/product';
import { ProductCard } from '../components/product/ProductCard';
import { Navbar } from '../components/layout/Navbar';
import { Search, ChevronLeft, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';

export const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const q = searchParams.get('q') || '';
        const cat = searchParams.get('cat') || searchParams.get('category') || '';
        const tag = searchParams.get('tag') || '';
        
        const { products: pData, totalPages: tPages, total: totalCount } = await productService.searchProducts(q, page, 20, cat, tag);
        setProducts(pData);
        setTotalPages(tPages);
        setTotalResults(totalCount);
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
    window.scrollTo(0, 0);
  }, [searchParams, query, page]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ q: query, page: newPage.toString() });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-4 mb-8">
           <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-gray-600" />
           </Link>
           <div>
              <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter italic">
                {query ? `Resultados para "${query}"` : 'Todos los productos'}
              </h1>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">
                {totalResults} {totalResults === 1 ? 'resultado encontrado' : 'resultados encontrados'}
              </p>
           </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="animate-spin text-blue-600 w-12 h-12" />
            <p className="font-black text-xs uppercase tracking-[0.3em] text-gray-400">Buscando productos...</p>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-16 flex justify-center items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="p-3 rounded-2xl bg-white shadow-sm border border-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                
                <div className="flex items-center gap-1 mx-4">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    // Mostrar solo algunas páginas si hay muchas
                    if (totalPages > 7) {
                      if (pageNum !== 1 && pageNum !== totalPages && Math.abs(pageNum - page) > 1) {
                        if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} className="px-2">...</span>;
                        return null;
                      }
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${
                          page === pageNum 
                          ? 'bg-blue-600 text-white shadow-lg scale-110' 
                          : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={page === totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="p-3 rounded-2xl bg-white shadow-sm border border-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                >
                  Siguiente <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-[40px] p-24 text-center shadow-xl border border-gray-100 animate-in fade-in duration-500 flex flex-col items-center">
            <div className="bg-gray-50 p-6 rounded-full mb-6">
               <Search size={48} className="text-gray-300" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase">No encontramos resultados</h2>
            <p className="text-gray-400 font-medium tracking-tight mb-8">Probá con palabras más generales o revisá la ortografía.</p>
            <Link to="/" className="bg-[#fff159] text-gray-800 px-10 py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all">Ver todos los productos</Link>
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
        .font-sans { font-family: 'Outfit', sans-serif; }
      `}</style>
    </div>
  );
};
