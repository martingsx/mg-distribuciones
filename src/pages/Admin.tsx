import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { productService } from '../services/productService';
import type { Category } from '../services/productService';
import type { Product } from '../types/product';
import { 
  Trash2, LayoutDashboard, Package, LogOut, Loader2, Search, TrendingUp, AlertCircle, Image as ImageIcon, Wallet,
  Users, Calendar, Phone, ChevronDown, ChevronUp, Download
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const LOW_STOCK_THRESHOLD = 5;
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'customers'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');

  const [newProduct, setNewProduct] = useState({
    name: '', cost: '', margin: '30', price: '0', description: '', category: '', stock: '', tag: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isAdding) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            if (blob.size > MAX_FILE_SIZE) {
              setStatus({ type: 'error', msg: 'Peso excedido (>1MB)' });
              return;
            }
            setImageFile(blob);
            setImagePreview(URL.createObjectURL(blob));
            setStatus({ type: 'success', msg: '¡Imagen capturada! ✨' });
            setTimeout(() => setStatus(null), 2000);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isAdding]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { data: pData, error: pError } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      const { data: cData, error: cError } = await supabase.from('categories').select('*').order('name', { ascending: true });
      const { data: oData, error: oError } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      
      if (pError) throw pError;
      if (cError) throw cError;
      if (oError) throw oError;

      setProducts(pData || []);
      setCategories(cData || []);
      setOrders(oData || []);

      if (cData && cData.length > 0 && !newProduct.category) {
        setNewProduct(prev => ({ ...prev, category: cData[0].name }));
      }
    } catch (err: any) {
      console.error("Error cargando datos:", err);
      setStatus({ type: 'error', msg: 'Error al conectar con la base de datos (Verificá si creaste las tablas)' });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, updates: any) => {
    try {
      await supabase.from('orders').update(updates).eq('id', orderId);
      await loadAll();
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const calculatePrice = (cost: number, margin: number) => parseFloat((cost * (1 + margin / 100)).toFixed(2));

  const handlePriceCalc = (val: string, type: 'cost' | 'margin', mode: 'new' | 'edit') => {
    if (mode === 'new') {
      const stateUpdate = { ...newProduct, [type]: val };
      const costValue = parseFloat(stateUpdate.cost) || 0;
      const marginValue = parseFloat(stateUpdate.margin) || 0;
      setNewProduct({ ...stateUpdate, price: calculatePrice(costValue, marginValue).toString() });
    } else {
      const currentCost = type === 'cost' ? (parseFloat(val) || 0) : (parseFloat(editForm.cost) || 0);
      const currentMargin = type === 'margin' ? (parseFloat(val) || 0) : (parseFloat(editForm.margin) || 0);
      setEditForm({ ...editForm, [type]: val, price: calculatePrice(currentCost, currentMargin) });
    }
  };

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setEditForm({ 
      ...product, 
      cost: product.cost.toString(), 
      margin: (product.margin || 30).toString(),
      stock: product.stock.toString()
    });
  };

  const handleUpdateTag = async (productId: string, tag: string) => {
    try {
      await supabase.from('products').update({ tag }).eq('id', productId);
      await loadAll();
      setStatus({ type: 'success', msg: 'Tag actualizado' });
      setTimeout(() => setStatus(null), 2000);
    } catch (error) {
       console.error('Error updating tag:', error);
       setStatus({ type: 'error', msg: 'Fallo al actualizar tag' });
    }
  };

  const saveEdit = async () => {
    if (!editingId || isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        name: String(editForm.name).trim(),
        category: String(editForm.category).trim(),
        cost: parseFloat(editForm.cost) || 0,
        margin: parseFloat(editForm.margin) || 0,
        price: Number(editForm.price),
        stock: parseInt(editForm.stock) || 0,
        tag: editForm.tag || ''
      };
      await supabase.from('products').update(payload).eq('id', editingId);
      setStatus({ type: 'success', msg: 'Actualizado' });
      setEditingId(null);
      await loadAll();
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatus(null), 2000);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return setStatus({ type: 'error', msg: 'Debes incluir una imagen' });
    setUploading(true);
    try {
      const imageUrl = await productService.uploadProductImage(imageFile);
      await productService.createProduct({
        ...newProduct, cost: parseFloat(newProduct.cost) || 0, 
        margin: parseFloat(newProduct.margin) || 0,
        price: parseFloat(newProduct.price) || 0, 
        stock: parseInt(newProduct.stock) || 0, 
        tag: (newProduct.tag as any) || '',
        image_url: imageUrl
      });
      setIsAdding(false);
      setNewProduct({ name: '', cost: '', margin: '30', price: '0', description: '', category: categories[0]?.name || '', tag: '', stock: '' });
      setImageFile(null);
      setImagePreview(null);
      await loadAll();
      setStatus({ type: 'success', msg: 'Producto creado' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setUploading(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${name}"? Esta acción borrará el registro y su imagen permanentemente.`)) return;
    
    setIsSaving(true);
    setStatus({ type: 'success', msg: 'Eliminando...' });
    
    try {
      await productService.deleteProduct(id);
      await loadAll();
      setStatus({ type: 'success', msg: 'Producto eliminado correctamente' });
    } catch (err: any) {
      console.error("Error al eliminar:", err);
      setStatus({ type: 'error', msg: err.message || 'Error al eliminar el producto' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) return setStatus({ type: 'error', msg: 'Peso excedido (>1MB)' });
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setStatus({ type: 'success', msg: 'Archivo cargado' });
      setTimeout(() => setStatus(null), 2000);
    }
  };

  const generatePDF = async () => {
    if (products.length === 0) {
      setStatus({ type: 'error', msg: 'No hay productos para exportar' });
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    setStatus({ type: 'success', msg: 'Preparando PDF... descargando imágenes' });

    try {
      const doc = new jsPDF();
      
      // Encabezado
      doc.setFontSize(22);
      doc.text('Lista de Precios - MG Distribuciones', 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Fecha de actualización: ${new Date().toLocaleDateString()}`, 14, 30);

      // Tabla: se agrega Imagen, se quita Stock, se cambia a Precio x Unidad
      const tableColumn = ["Imagen", "Producto", "Categoría", "Precio x Unidad"];
      const tableRows: any[] = [];

      // Ordenar productos por categoría y luego por nombre
      const sortedProducts = [...products].sort((a, b) => {
        if(a.category < b.category) return -1;
        if(a.category > b.category) return 1;
        return a.name.localeCompare(b.name);
      });

      // Pre-cargar imágenes a base64
      const productsWithImages = await Promise.all(sortedProducts.map(async (prod) => {
        let base64 = null;
        if (prod.image_url) {
          try {
             const res = await fetch(prod.image_url);
             const blob = await res.blob();
             base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
             });
          } catch(e) { console.error("Error loading image", e); }
        }
        return { ...prod, base64 };
      }));

      productsWithImages.forEach(product => {
        const productData = [
          '', // placeholder para la imagen
          product.name,
          product.category || '---',
          `$${product.price.toLocaleString(undefined, {minimumFractionDigits: 2})}`
        ];
        tableRows.push(productData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 10, minCellHeight: 18, valign: 'middle' },
        headStyles: { fillColor: [37, 99, 235] }, // blue-600
        columnStyles: {
            0: { cellWidth: 24, halign: 'center' }, // Columna imagen
            1: { cellWidth: 'auto' }, // Nombre
            2: { cellWidth: 40 }, // Categoría
            3: { cellWidth: 35, halign: 'center' } // Precio
        },
        didDrawCell: (data) => {
          // Si estamos en la columna 0 (Imagen) y es el tbody dibujar la imagen
          if (data.column.index === 0 && data.cell.section === 'body') {
            const product = productsWithImages[data.row.index];
            if (product && product.base64) {
               const imgWidth = 14;
               const imgHeight = 14;
               // Centrar imagen en la celda
               const x = data.cell.x + (data.cell.width - imgWidth) / 2;
               const y = data.cell.y + (data.cell.height - imgHeight) / 2;
               doc.addImage(product.base64 as string, x, y, imgWidth, imgHeight);
            }
          }
        }
      });

      doc.save(`Lista_Precios_MG_${new Date().toISOString().split('T')[0]}.pdf`);
      setStatus({ type: 'success', msg: '¡PDF generado con éxito!' });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      setStatus({ type: 'error', msg: 'Ocurrió un error al generar el PDF' });
    } finally {
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const filteredProducts = products.filter(p => (filterCategory === 'Todos' || p.category === filterCategory) && p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredOrders = orders.filter(o => o.customer_name.toLowerCase().includes(orderSearch.toLowerCase()));

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans">
      <aside className="w-64 bg-[#0f172a] text-white fixed h-full flex flex-col z-20 shadow-2xl">
        <div className="p-10 border-b border-white/5 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white"><Package size={24} /></div>
          <h1 className="text-xl font-black uppercase tracking-tighter italic">MG<br/>Panel</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4 text-sm font-bold">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}><LayoutDashboard size={20}/>Métricas</button>
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all ${activeTab === 'inventory' ? 'bg-blue-600 shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}><Package size={20}/>Inventario</button>
          <button onClick={() => setActiveTab('customers')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all ${activeTab === 'customers' ? 'bg-blue-600 shadow-xl' : 'text-slate-400 hover:bg-white/5'}`}><Users size={20}/>Clientes</button>
        </nav>
        <div className="p-6 border-t border-white/5"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-500/10 text-red-400 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all"><LogOut size={16} /> Salir</button></div>
      </aside>

      <main className="flex-1 ml-64 min-h-screen relative bg-[#f8fafc]">
        {status && <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top"><div className={`px-10 py-5 rounded-[24px] shadow-2xl border-2 flex items-center gap-4 ${status.type === 'success' ? 'bg-blue-600 border-blue-400' : 'bg-red-500 border-red-400'} text-white`}><AlertCircle size={20} /><span className="font-black uppercase tracking-widest text-[10px]">{status.msg}</span></div></div>}

        <header className="bg-white/90 backdrop-blur-md border-b px-10 py-6 flex items-center justify-between sticky top-0 z-40">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Sistema MG</h2>
          <div className="flex gap-3">
            {activeTab === 'inventory' && (
              <>
                <button onClick={generatePDF} className="bg-slate-100 flex items-center gap-2 text-blue-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"><Download size={14}/> PDF</button>
                <button onClick={() => setIsManagingCategories(true)} className="bg-slate-100 text-slate-500 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200">Secciones</button>
              </>
            )}
            <button onClick={() => setIsAdding(true)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-2xl hover:scale-105 active:scale-95 transition-all outline-none">Nueva Carga</button>
          </div>
        </header>

        <div className="p-10">
          {loading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div> : activeTab === 'dashboard' ? (
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white p-12 rounded-[40px] shadow-sm border border-slate-100 flex justify-between items-center font-sans">
                <div className="space-y-1"><p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest">Inversión (Costo)</p><h3 className="text-4xl font-black text-slate-900">${products.reduce((acc, p) => acc + (p.cost * p.stock), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</h3></div>
                <Wallet size={40} className="text-orange-500/20" />
              </div>
              <div className="bg-white p-12 rounded-[40px] shadow-sm border border-slate-100 flex justify-between items-center font-sans">
                <div className="space-y-1"><p className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest">Venta Estimada</p><h3 className="text-4xl font-black text-slate-900">${products.reduce((acc, p) => acc + (p.price * p.stock), 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</h3></div>
                <TrendingUp size={40} className="text-blue-500/20" />
              </div>
            </div>
          ) : activeTab === 'inventory' ? (
            <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden font-sans">
               <div className="p-5 border-b border-slate-50 flex items-center gap-4">
                  <Search className="text-slate-500" size={18}/><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 font-bold outline-none text-sm placeholder-slate-400" placeholder="Ref comercial..." /><select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="font-black text-[10px] uppercase text-slate-600 outline-none"><option value="Todos">Global</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
               </div>
               <table className="w-full text-left">
                  <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-600 border-b tracking-widest">
                    <tr><th className="px-10 py-5 italic">Nombre</th><th className="px-5 py-5 text-center">Cat</th><th className="px-5 py-5 text-center">Tag</th><th className="px-5 py-5 text-center">Costo</th><th className="px-5 py-5 text-center">MG %</th><th className="px-5 py-5 text-center">Final</th><th className="px-8 py-5 text-center">Stock</th><th className="px-10 py-5 text-right underline">Acción</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredProducts.map(product => {
                      const isEditing = editingId === product.id;
                      return (
                        <tr key={product.id} className={`group transition-all ${isEditing ? 'bg-blue-50/50' : 'hover:bg-slate-50/50 cursor-pointer'}`} onClick={() => !isEditing && startEditing(product)}>
                          <td className="px-10 py-6 flex items-center gap-5">
                            <img src={product.image_url} className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
                            {isEditing ? <input onClick={e => e.stopPropagation()} autoFocus value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="px-3 py-1.5 border border-blue-200 rounded-lg font-bold w-full bg-white outline-none" /> : <h5 className="font-black text-slate-800 uppercase tracking-tighter text-base leading-none truncate max-w-[150px] italic">{product.name}</h5>}
                          </td>
                          <td className="px-5 py-6 text-center">
                            {isEditing ? (
                              <select onClick={e => e.stopPropagation()} value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="px-2 py-1.5 border border-blue-200 rounded-lg font-bold text-[10px] uppercase bg-white outline-none">
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                              </select>
                            ) : (
                              <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full font-black text-[8px] uppercase">{product.category || '---'}</span>
                            )}
                          </td>
                          <td className="px-5 py-6 text-center">
                            <select 
                              onClick={e => e.stopPropagation()} 
                              value={['Oferta', 'Liquidación', ''].includes(product.tag || '') ? product.tag || '' : 'CUSTOM'} 
                              onChange={async (e) => {
                                let val = e.target.value;
                                if (val === 'CUSTOM') {
                                  const custom = prompt('Ingrese un tag personalizado:', product.tag || '');
                                  if (custom !== null && custom.trim() !== '') val = custom;
                                  else if (custom === null) return;
                                }
                                handleUpdateTag(product.id, val);
                              }} 
                              className={`px-2 py-1.5 border rounded-lg font-black text-[10px] uppercase bg-white outline-none cursor-pointer transition-all ${
                                product.tag === 'Oferta' ? 'border-green-200 text-green-600 bg-green-50/50' : 
                                product.tag === 'Liquidación' ? 'border-orange-200 text-orange-600 bg-orange-50/50' : 
                                product.tag ? 'border-blue-200 text-blue-600 bg-blue-50/50' :
                                'border-slate-200 text-slate-400'
                              }`}
                            >
                              <option value="">Sin Tag</option>
                              <option value="Oferta">Oferta</option>
                              <option value="Liquidación">Liquidación</option>
                              <option value="CUSTOM">Personalizado...</option>
                            </select>
                          </td>
                          <td className="px-5 py-6 text-center">
                            {isEditing ? (
                              <input onClick={e => e.stopPropagation()} type="number" step="0.01" value={editForm.cost} onChange={e => handlePriceCalc(e.target.value, 'cost', 'edit')} className="w-20 px-2 py-1.5 border border-blue-200 rounded-lg font-black text-[10px] outline-none text-center" />
                            ) : (
                              <span className="font-bold text-slate-300 tracking-tighter italic">${product.cost.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                            )}
                          </td>
                          <td className="px-5 py-6 text-center">
                            {isEditing ? (
                              <input onClick={e => e.stopPropagation()} type="number" value={editForm.margin} onChange={e => handlePriceCalc(e.target.value, 'margin', 'edit')} className="w-12 px-2 py-1.5 border border-blue-200 rounded-lg font-black text-[10px] outline-none text-center" />
                            ) : (
                              <span className="text-[9px] font-black text-blue-400 px-2 py-1 bg-blue-50 rounded-lg">{product.margin}%</span>
                            )}
                          </td>
                          <td className="px-5 py-6 text-center font-black text-slate-800 text-lg tracking-tighter italic">
                             ${(isEditing ? editForm.price : product.price).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-8 py-6 text-center font-black text-slate-500">
                             {isEditing ? (
                               <input onClick={e => e.stopPropagation()} type="number" value={editForm.stock} onChange={e => setEditForm({...editForm, stock: e.target.value})} className="w-16 px-2 py-1.5 border border-blue-200 rounded-lg font-black text-[10px] outline-none text-center" />
                             ) : (
                               <span className={`px-4 py-1.5 rounded-lg text-xs ${product.stock <= LOW_STOCK_THRESHOLD ? 'bg-red-50 text-red-500 font-black' : 'bg-slate-100/30'}`}>{product.stock}</span>
                             )}
                          </td>
                          <td className="px-10 py-6 text-right">
                            <div className="flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
                              {isEditing ? (
                                <button onClick={saveEdit} className="px-5 py-2.5 bg-green-500 text-white rounded-xl shadow-lg font-black uppercase text-[10px]">OK</button>
                              ) : (
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(product.id, product.name); }} className="p-3 text-slate-200 hover:text-red-400 transition-all font-sans">✕</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
            </div>
          ) : (
            /* CUSTOMERS TAB COMPLETO */
            <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden font-sans">
               <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 max-w-md">
                    <Search className="text-slate-300" size={20} />
                    <input 
                      value={orderSearch} 
                      onChange={e => setOrderSearch(e.target.value)} 
                      className="flex-1 font-bold outline-none text-lg tracking-tighter italic" 
                      placeholder="Buscar cliente por nombre..." 
                    />
                  </div>
                  <div className="flex gap-2">
                    <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">{filteredOrders.length} Pedidos Registrados</span>
                  </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-100/50 text-[10px] font-black uppercase text-slate-400 border-b tracking-[0.2em]">
                      <tr>
                        <th className="px-10 py-6">Cliente y Contacto</th>
                        <th className="px-8 py-6">Pedido</th>
                        <th className="px-8 py-6 text-center">Estado Pago</th>
                        <th className="px-8 py-6 text-center">Estado Entrega</th>
                        <th className="px-10 py-6 text-right font-black">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredOrders.length === 0 ? (
                        <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs italic">No se encontraron pedidos registrados</td></tr>
                      ) : (
                        filteredOrders.map(order => {
                          const isExpanded = expandedOrderId === order.id;
                          return (
                            <>
                              <tr key={order.id} className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/20' : ''}`} onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                                <td className="px-10 py-8">
                                   <div className="flex flex-col">
                                     <h5 className="text-lg font-black text-slate-800 tracking-tighter italic leading-none mb-1">{order.customer_name}</h5>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{order.customer_city} • {order.customer_address}</p>
                                     <div className="flex items-center gap-1.5 mt-2 text-blue-600 font-black text-[10px]">
                                       <Phone size={12}/> {order.customer_phone}
                                     </div>
                                   </div>
                                </td>
                                <td className="px-8 py-8">
                                   <div className="flex flex-col gap-1.5">
                                     <div className="flex items-center gap-2 text-slate-400 mb-2">
                                       <Calendar size={12} />
                                       <span className="text-[9px] font-black uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</span>
                                     </div>
                                     <div className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase">
                                       {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                       <span>{order.items?.length} productos</span>
                                     </div>
                                   </div>
                                </td>
                                <td className="px-8 py-8" onClick={e => e.stopPropagation()}>
                                   <select 
                                     value={['Pendiente', 'Pagado'].includes(order.payment_status) ? order.payment_status : 'Otro'}
                                     onChange={async (e) => {
                                       let val = e.target.value;
                                       if (val === 'Otro') {
                                         const custom = prompt('Ingrese el estado de pago personalizado:', order.payment_status);
                                         if (custom !== null) val = custom;
                                       }
                                       updateOrderStatus(order.id, { payment_status: val });
                                     }}
                                     className={`w-full py-2 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none border transition-all ${
                                       order.payment_status === 'Pagado' ? 'bg-green-100 text-green-600 border-green-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                                     }`}
                                   >
                                     <option value="Pendiente">Pendiente</option>
                                     <option value="Pagado">Pagado</option>
                                     <option value="Otro">Personalizado...</option>
                                   </select>
                                   {!['Pendiente', 'Pagado'].includes(order.payment_status) && (
                                     <p className="text-center text-[8px] font-black text-blue-400 uppercase mt-2">{order.payment_status}</p>
                                   )}
                                </td>
                                <td className="px-8 py-8" onClick={e => e.stopPropagation()}>
                                   <select 
                                     value={['En camino', 'Entregado'].includes(order.delivery_status) ? order.delivery_status : 'Otro'}
                                     onChange={(e) => {
                                       let val = e.target.value;
                                       if (val === 'Otro') {
                                         const custom = prompt('Ingrese el estado de entrega personalizado:', order.delivery_status);
                                         if (custom !== null) val = custom;
                                       }
                                       updateOrderStatus(order.id, { delivery_status: val });
                                     }}
                                     className={`w-full py-2 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none border transition-all ${
                                       order.delivery_status === 'Entregado' ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-orange-50 text-orange-600 border-orange-200'
                                     }`}
                                   >
                                     <option value="En camino">En camino</option>
                                     <option value="Entregado">Entregado</option>
                                     <option value="Otro">Personalizado...</option>
                                   </select>
                                   {!['En camino', 'Entregado'].includes(order.delivery_status) && (
                                     <p className="text-center text-[8px] font-black text-blue-400 uppercase mt-2">{order.delivery_status}</p>
                                   )}
                                </td>
                                <td className="px-10 py-8 text-right">
                                   <span className="text-xl font-black text-slate-900 tracking-tighter italic">${Number(order.total).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-slate-50/50">
                                  <td colSpan={5} className="px-10 py-6 animate-in slide-in-from-top-2">
                                     <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm space-y-3">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Detalle del Pedido</p>
                                        {order.items?.map((item: any, idx: number) => (
                                          <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-2">
                                            <span className="text-sm font-bold text-slate-600 uppercase">{item.name} <span className="text-blue-500 ml-2">x{item.quantity}</span></span>
                                            <span className="text-sm font-black text-slate-800 tracking-tighter italic">${(item.price * item.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                          </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-2">
                                           <span className="text-[10px] font-black text-slate-900 uppercase">Método de pago preferido:</span>
                                           <span className="text-[10px] font-black text-blue-600 uppercase italic">{order.payment_method}</span>
                                        </div>
                                     </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          )
                        })
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Alta Producto - CTRL+V FIXED */}
      {isAdding && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in transition-all">
            <div className="bg-white rounded-[40px] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in font-sans">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic">Carga de Datos</h3>
                  <button onClick={() => setIsAdding(false)} className="text-slate-300 hover:text-red-500 font-bold transition-all">X</button>
               </div>
               <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-300 uppercase ml-4">Referencia Comercial</label><input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-[20px] font-bold outline-none border-2 border-transparent focus:border-blue-100 transition-all" placeholder="Pincel, Rodillo, etc..." /></div>
                  
                  {/* DROP/PASTE AREA REDESIGNED */}
                  <div className={`p-6 rounded-[24px] border-2 border-dashed transition-all flex items-center gap-4 ${imageFile ? 'border-green-400 bg-green-50/20' : 'border-blue-100 bg-blue-50/5'}`}>
                      {imagePreview ? (
                         <img src={imagePreview} className="w-14 h-14 rounded-lg object-cover shadow-md border-2 border-white" />
                      ) : (
                         <div className="bg-white p-2.5 rounded-lg text-blue-500 shadow-sm"><ImageIcon size={20}/></div>
                      )}
                      
                      <div className="flex-1">
                        <p className={`text-[10px] font-black uppercase ${imageFile ? 'text-green-600' : 'text-blue-500'}`}>
                           {imageFile ? 'Imagen Listá para subirse' : '¡Pega con CTRL + V!'}
                        </p>
                        <p className="text-[8px] font-bold text-slate-300 uppercase">O selecciona tu archivo manualmente</p>
                      </div>

                      <div className="relative">
                        <input type="file" accept="image/*" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <button type="button" className="bg-white border border-slate-100 px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-sm">Buscar</button>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-300 uppercase ml-4">Sección</label><select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 rounded-[18px] font-black text-[10px] uppercase outline-none">
                       {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-300 uppercase ml-4">Stock</label><input type="number" required value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 rounded-[18px] font-black outline-none text-xs" placeholder="0" /></div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-300 uppercase ml-4">Tag</label>
                      <div className="flex gap-2">
                        <select 
                          value={['Oferta', 'Liquidación', ''].includes(newProduct.tag) ? newProduct.tag : 'CUSTOM'} 
                          onChange={e => {
                            const val = e.target.value;
                            if (val === 'CUSTOM') {
                              setNewProduct({...newProduct, tag: 'NUEVO'});
                            } else {
                              setNewProduct({...newProduct, tag: val});
                            }
                          }} 
                          className="flex-1 px-5 py-3.5 bg-slate-50 rounded-[18px] font-black text-[10px] uppercase outline-none"
                        >
                           <option value="">Sin Tag</option>
                           <option value="Oferta">Oferta</option>
                           <option value="Liquidación">Liquidación</option>
                           <option value="CUSTOM">Personalizado...</option>
                        </select>
                        {!['Oferta', 'Liquidación', ''].includes(newProduct.tag) && (
                          <input 
                            value={newProduct.tag} 
                            onChange={e => setNewProduct({...newProduct, tag: e.target.value})} 
                            className="flex-1 px-5 py-3.5 bg-blue-50/50 rounded-[18px] font-black text-[10px] uppercase outline-none border border-blue-100 placeholder-blue-300"
                            placeholder="Escribí acá..."
                            autoFocus
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-black text-orange-400 uppercase ml-4">Costo Exacto</label><input type="number" step="0.01" required value={newProduct.cost} onChange={e => handlePriceCalc(e.target.value, 'cost', 'new')} className="w-full bg-orange-50/10 px-5 py-3.5 rounded-[18px] font-black outline-none text-xs" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-blue-500 uppercase ml-4">Rendimiento %</label><input type="number" step="0.1" value={newProduct.margin} onChange={e => handlePriceCalc(e.target.value, 'margin', 'new')} className="w-full bg-blue-50/10 px-5 py-3.5 rounded-[18px] font-black outline-none text-xs" /></div>
                  </div>

                  <div className="pt-2 flex items-center gap-4">
                     <div className="flex-1 bg-slate-900 px-6 py-5 rounded-[24px] flex flex-col justify-center"><span className="text-slate-500 text-[8px] font-black tracking-[0.4em] mb-1 uppercase">PVP FINAL</span><h4 className="text-white text-3xl font-black tracking-tighter italic leading-none">${parseFloat(newProduct.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</h4></div>
                     <button disabled={uploading} className="px-10 h-[70px] bg-blue-600 text-white rounded-[24px] font-black uppercase text-[10px] shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                       {uploading ? <Loader2 className="animate-spin mx-auto"/> : 'CONFIRMAR'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Categories Manager */}
      {isManagingCategories && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in font-sans">
           <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl space-y-6">
              <div className="flex justify-between items-center"><h3 className="text-xl font-black text-slate-900 uppercase">Secciones</h3><button onClick={() => setIsManagingCategories(false)} className="text-slate-300">✕</button></div>
              <form onSubmit={e => { e.preventDefault(); if(!newCatName.trim()) return; productService.createCategory(newCatName).then(() => { setNewCatName(''); loadAll(); }) }} className="flex gap-3">
                 <input value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-1 bg-slate-50 px-5 py-4 rounded-[18px] font-bold outline-none text-sm" placeholder="Nueva..." />
                 <button className="bg-blue-600 text-white px-6 rounded-[18px] font-black uppercase text-[10px]">OK</button>
              </form>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                 {categories.map(c => <div key={c.id} className="flex justify-between items-center px-4 py-3 bg-slate-50/50 rounded-[14px] font-black text-[10px] uppercase text-slate-400">{c.name}<button onClick={() => productService.deleteCategory(c.id).then(loadAll)} className="text-slate-200 hover:text-red-500"><Trash2 size={14}/></button></div>)}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
