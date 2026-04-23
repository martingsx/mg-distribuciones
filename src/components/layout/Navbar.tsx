import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Store, Loader2, ChevronDown, Menu, X, ChevronRight, PhoneCall } from 'lucide-react';
import { productService } from '../../services/productService';
import type { Category } from '../../services/productService';
import type { Product } from '../../types/product';
import { useCart } from '../../context/CartContext';

export const Navbar = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const { totalItems } = useCart();

  useEffect(() => {
    productService.getCategories().then(setCategories);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true);
        try {
          const { products } = await productService.searchProducts(query, 1, 10);
          setSuggestions(products);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSuggestionClick = (product: Product) => {
    setQuery('');
    setShowSuggestions(false);
    navigate(`/product/${product.id}`);
  };

  return (
    <>
      <nav className="bg-[#fff159] shadow-md sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col py-2 md:py-3">
            {/* Main Top Bar */}
            <div className="flex items-center justify-between h-14 md:h-16 gap-3 md:gap-8">
              
              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setShowMobileMenu(true)}
                className="md:hidden p-2 text-gray-800 hover:bg-black/5 rounded-full"
              >
                <Menu size={24} />
              </button>

              <Link to="/" className="flex items-center gap-2 shrink-0">
                <Store className="h-7 w-7 md:h-9 md:w-9 text-[#3483fa]" />
                <span className="font-black text-xl md:text-2xl text-gray-800 tracking-tighter leading-none italic">MG</span>
              </Link>

              <div ref={searchRef} className="flex-1 max-w-2xl relative w-full">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    value={query}
                    autoComplete="off"
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
                    placeholder="Buscar productos..."
                    className="w-full bg-white border-none rounded-sm py-2 px-4 shadow-sm focus:ring-2 focus:ring-[#3483fa] outline-none transition-all placeholder:text-gray-400 text-sm h-10"
                  />
                  <button type="submit" className="absolute right-0 top-0 h-full px-3 border-l border-gray-100 text-gray-400 hover:text-gray-600">
                    {isSearching ? <Loader2 className="h-5 w-5 animate-spin text-blue-500" /> : <Search className="h-5 w-5" />}
                  </button>
                </form>

                {/* Suggestions Dropdown */}
                {showSuggestions && (suggestions.length > 0 || isSearching) && (
                  <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white rounded-md shadow-2xl border border-gray-100 overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                    {isSearching && suggestions.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-400 flex items-center justify-center gap-2 font-bold">
                        <Loader2 size={16} className="animate-spin text-blue-500" /> BUSCANDO...
                      </div>
                    ) : (
                      <div className="py-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {suggestions.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleSuggestionClick(product)}
                            className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                          >
                            <img src={product.image_url} alt="" className="w-10 h-10 object-contain rounded bg-white shadow-sm border border-gray-100" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate uppercase">{product.name}</p>
                              <p className="text-xs text-blue-600 font-bold tracking-tight">$ {product.price.toLocaleString('es-AR')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 md:gap-6 shrink-0">
                <Link to="/cart" className="flex items-center gap-1 text-gray-800 relative p-2 hover:bg-black/5 rounded-full transition-all group">
                  <ShoppingCart className="h-6 w-6 md:h-7 md:w-7 group-hover:scale-110 transition-transform" />
                  {totalItems > 0 && (
                    <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-[#fff159]">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </div>
            </div>
            
            {/* Desktop Sub Navbar */}
            <div className="hidden md:flex items-center gap-8 mt-2 text-xs font-black text-gray-800 uppercase tracking-tight italic">
              <div 
                className="relative"
                onMouseEnter={() => setShowCatDropdown(true)}
                onMouseLeave={() => setShowCatDropdown(false)}
              >
                <button className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors pb-1">
                  CATEGORÍAS <ChevronDown size={14} />
                </button>
                
                {showCatDropdown && (
                  <div className="absolute top-full left-0 w-64 bg-white shadow-2xl rounded-2xl py-6 border border-gray-100 z-[110] animate-in fade-in slide-in-from-top-2">
                    {categories.map(cat => (
                      <Link 
                        key={cat.id} 
                        to={`/search?category=${encodeURIComponent(cat.name)}`}
                        className="block px-8 py-3 text-gray-500 hover:bg-blue-50 hover:text-blue-600 font-black tracking-widest text-[10px] uppercase transition-all"
                        onClick={() => setShowCatDropdown(false)}
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/search?tag=Oferta" className="hover:text-blue-600 transition-colors pb-1">Ofertas</Link>
              <Link to="/contacto" className="hover:text-blue-600 transition-colors pb-1">Contacto</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[200] md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Content */}
          <div className="absolute top-0 left-0 w-[85%] max-w-sm h-full bg-white shadow-2xl animate-in slide-in-from-left duration-500 overflow-y-auto font-sans">
             <div className="bg-[#fff159] p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Store className="h-8 w-8 text-[#3483fa]" />
                    <span className="font-black text-xl italic tracking-tighter">MG</span>
                  </div>
                  <button onClick={() => setShowMobileMenu(false)} className="bg-white/20 p-2 rounded-full"><X size={20}/></button>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Navegación Móvil</p>
             </div>

             <div className="p-6 space-y-8">
                <div className="space-y-4">
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-2">Principales</p>
                   <Link to="/" onClick={() => setShowMobileMenu(false)} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl font-black uppercase text-xs text-gray-800">Inicio <ChevronRight size={16}/></Link>
                   <Link to="/contacto" onClick={() => setShowMobileMenu(false)} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl font-black uppercase text-xs text-gray-800">Contacto <ChevronRight size={16}/></Link>
                   <Link to="/search?tag=Oferta" onClick={() => setShowMobileMenu(false)} className="flex items-center justify-between p-4 bg-orange-50 text-orange-600 rounded-2xl font-black uppercase text-xs">¡Ofertas Hot! <ChevronRight size={16}/></Link>
                </div>

                <div className="space-y-4">
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest px-2">CATEGORÍAS</p>
                   <div className="grid grid-cols-1 gap-2">
                      {categories.map(cat => (
                        <Link 
                          key={cat.id} 
                          to={`/search?category=${encodeURIComponent(cat.name)}`}
                          onClick={() => setShowMobileMenu(false)}
                          className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl font-bold uppercase text-[10px] text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
                        >
                          {cat.name} <ChevronRight size={14} className="opacity-30"/>
                        </Link>
                      ))}
                   </div>
                </div>

                <div className="pt-6 border-t font-sans">
                   <div className="flex items-center gap-4 text-blue-600 bg-blue-50 p-6 rounded-3xl mb-10">
                      <PhoneCall size={28} />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Ayuda en línea</p>
                        <p className="text-sm font-black italic tracking-tighter uppercase">+54 9 341 503-0742</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </>
  );
};
