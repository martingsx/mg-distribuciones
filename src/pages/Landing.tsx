import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../types/product";
import { productService } from "../services/productService";
import type { Category } from "../services/productService";
import { ProductCard } from "../components/product/ProductCard";
import { Navbar } from "../components/layout/Navbar";
import { Filter } from "lucide-react";

export const Landing = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Todos");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pData, cData] = await Promise.all([
          productService.getProducts(),
          productService.getCategories(),
        ]);
        setProducts(pData);
        setFilteredProducts(pData);
        setCategories(cData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (activeCategory === "Todos") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(
        products.filter((p) => p.category === activeCategory),
      );
    }
  }, [activeCategory, products]);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      {/* Hero Banner - Responsive Fix */}
      <div className="w-full h-[450px] md:h-[600px] relative overflow-hidden group">
        {/* Background Image with Dark Overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10000ms] group-hover:scale-110"
          style={{
            backgroundImage:
              'url("https://d3t4nwcgmfrp9x.cloudfront.net/upload/tendencias-entrega-paquetes-para-2022.jpg")',
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 h-full flex flex-col items-center justify-center relative z-10 text-center">
          <div className="animate-in fade-in zoom-in duration-1000 pb-10 md:pb-20 flex flex-col items-center w-full">
            <span className="inline-block bg-blue-600/60 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-[8px] md:text-[10px] font-black mb-6 tracking-[0.3em] text-white uppercase shadow-xl">
              Venta Mayorista
            </span>
            <h1 className="text-3xl md:text-8xl font-black mb-6 md:mb-8 leading-none tracking-tighter italic drop-shadow-2xl text-white uppercase">
              MG DISTRIBUCIONES
            </h1>
            <p className="text-xs md:text-2xl text-white font-bold mb-10 md:mb-12 leading-tight drop-shadow-lg max-w-4xl px-4">
              Expandí tu negocio con los mejores precios del mercado
            </p>
            <div className="flex flex-row gap-2 justify-center w-full max-w-[280px] md:max-w-xl">
              <button
                onClick={() =>
                  window.scrollTo({ top: window.innerWidth < 768 ? 400 : 550, behavior: "smooth" })
                }
                className="bg-white text-blue-600 px-2 md:px-10 py-3 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[8px] md:text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all flex-1 whitespace-nowrap"
              >
                Catálogo
              </button>
              <Link
                to="/contacto"
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-2 md:px-10 py-3 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[8px] md:text-xs hover:bg-white/20 transition-all flex-1 whitespace-nowrap text-center"
              >
                Contacto
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 md:-mt-20 pb-20 relative z-20">
        {/* Category Filter - Text indicator instead of arrows */}
        <div className="max-w-7xl mx-auto mb-8 md:mb-14">
          <p className="text-[10px] font-black text-white uppercase tracking-widest mb-4 text-center md:hidden animate-pulse">
            ← Deslizá para ver las categorías →
          </p>
          
          <div className="bg-white p-3 md:p-6 rounded-3xl md:rounded-[40px] shadow-2xl shadow-black/5 border border-gray-100 flex items-center gap-4 overflow-x-auto no-scrollbar px-4 md:px-10">
            <div className="flex items-center gap-2 px-3 border-r border-gray-100 text-gray-400 shrink-0">
              <Filter size={14} className="md:w-[18px]" />
            </div>
            <div className="flex gap-1.5 md:gap-2 md:justify-center flex-1">
              <button
                onClick={() => setActiveCategory("Todos")}
                className={`px-4 md:px-6 py-2 rounded-xl md:rounded-2xl text-[9px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeCategory === "Todos"
                    ? "bg-[#3483fa] text-white shadow-lg"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`px-4 md:px-6 py-2 rounded-xl md:rounded-2xl text-[9px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeCategory === cat.name
                      ? "bg-[#3483fa] text-white shadow-lg"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-4 h-[350px] space-y-4 animate-pulse"
                />
              ))
            : filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>

        {!loading && filteredProducts.length === 0 && (
          <div className="bg-white rounded-[40px] p-24 text-center shadow-xl border border-gray-100 animate-in fade-in duration-500">
            <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase">
              Sin stock en esta sección
            </h2>
            <p className="text-gray-400 font-medium tracking-tight">
              Pronto recibiremos nuevos ingresos de {activeCategory}.
            </p>
          </div>
        )}
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
