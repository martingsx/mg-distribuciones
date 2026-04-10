import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useCart } from '../context/CartContext';
import { Navbar } from '../components/layout/Navbar';
import { 
  Trash2, Plus, Minus, Send, ShoppingBag, 
  ArrowLeft, CreditCard, Wallet 
} from 'lucide-react';

export const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    phone: '',
    payment: 'Efectivo',
    customPayment: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate WhatsApp message
    const businessPhone = "5493415030742"; 
    const finalPayment = formData.payment === 'Otro' ? formData.customPayment : formData.payment;
    
    let message = `*NUEVO PEDIDO - MG DISTRIBUCIONES*\n\n`;
    message += `*CLIENTE:* ${formData.name}\n`;
    message += `*LOCALIDAD:* ${formData.city}\n`;
    message += `*DIRECCIÓN:* ${formData.address}\n`;
    message += `*TELÉFONO:* ${formData.phone}\n`;
    message += `*PAGO:* ${finalPayment}\n\n`;
    message += `*PRODUCTOS:*\n`;
    
    cart.forEach(item => {
      message += `- ${item.name} (x${item.quantity}) - $ ${(item.price * item.quantity).toLocaleString('es-AR')}\n`;
    });
    
    message += `\n*TOTAL: $ ${totalPrice.toLocaleString('es-AR')}*`;
    
    // Save to Database
    const saveOrder = async () => {
      try {
        const orderData = {
          customer_name: formData.name,
          customer_city: formData.city,
          customer_address: formData.address,
          customer_phone: formData.phone,
          payment_method: finalPayment,
          total: totalPrice,
          items: cart.map(item => ({
             name: item.name,
             price: item.price,
             quantity: item.quantity
          }))
        };
        await supabase.from('orders').insert(orderData);
      } catch (error) {
        console.error("Error saving order:", error);
      }
    };

    await saveOrder();

    window.open(`https://wa.me/${businessPhone}?text=${encodeURIComponent(message)}`, '_blank');
    clearCart();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-4 mb-10">
           <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-gray-600" />
           </Link>
           <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter italic">Tu Carrito</h1>
        </div>

        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-6 group">
                   <img src={item.image_url} alt={item.name} className="w-24 h-24 object-contain" />
                   <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-tighter truncate">{item.name}</h3>
                      <p className="text-xl font-black text-gray-900 mt-1">$ {item.price.toLocaleString('es-AR')}</p>
                      <div className="flex items-center gap-4 mt-4">
                         <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all"><Minus size={14}/></button>
                            <span className="w-10 text-center font-black text-sm">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all"><Plus size={14}/></button>
                         </div>
                         <button onClick={() => removeFromCart(item.id)} className="text-red-300 hover:text-red-500 transition-colors p-2"><Trash2 size={18}/></button>
                      </div>
                   </div>
                   <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Subtotal</p>
                      <p className="text-lg font-black text-gray-900 italic">$ {(item.price * item.quantity).toLocaleString('es-AR')}</p>
                   </div>
                </div>
              ))}
            </div>

            {/* Checkout Form */}
            <div className="space-y-6">
               <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-gray-100 space-y-6">
                  <h3 className="text-xl font-black uppercase tracking-tighter italic border-b border-gray-50 pb-4">Detalles del Envío</h3>
                  <form onSubmit={handleCheckout} className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-600 uppercase ml-4 tracking-widest">Nombre y Apellido</label>
                        <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-gray-200 px-6 py-4 rounded-2xl outline-none font-bold text-sm border-2 border-gray-300 focus:border-blue-600 focus:bg-white transition-all text-gray-900 placeholder-gray-500" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-600 uppercase ml-4 tracking-widest">Localidad</label>
                        <input required name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-gray-200 px-6 py-4 rounded-2xl outline-none font-bold text-sm border-2 border-gray-300 focus:border-blue-600 focus:bg-white transition-all text-gray-900 placeholder-gray-500" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-600 uppercase ml-4 tracking-widest">Dirección Exacta</label>
                        <input required name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-gray-200 px-6 py-4 rounded-2xl outline-none font-bold text-sm border-2 border-gray-300 focus:border-blue-600 focus:bg-white transition-all text-gray-900 placeholder-gray-500" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-600 uppercase ml-4 tracking-widest">Teléfono de Contacto</label>
                        <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-gray-200 px-6 py-4 rounded-2xl outline-none font-bold text-sm border-2 border-gray-300 focus:border-blue-600 focus:bg-white transition-all text-gray-900 placeholder-gray-500" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-600 uppercase ml-4 tracking-widest">Método de Pago</label>
                        <select name="payment" value={formData.payment} onChange={handleInputChange} className="w-full bg-gray-200 px-6 py-4 rounded-2xl outline-none font-bold text-sm border-2 border-gray-300 focus:border-blue-600 focus:bg-white transition-all text-gray-900">
                           <option value="Efectivo">Efectivo al recibir</option>
                           <option value="Transferencia">Transferencia Bancaria</option>
                           <option value="Otro">Otro medio...</option>
                        </select>
                     </div>

                     {formData.payment === 'Otro' && (
                        <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                           <label className="text-[10px] font-black text-gray-600 uppercase ml-4 tracking-widest">Especificar Medio</label>
                           <input required name="customPayment" value={formData.customPayment} onChange={handleInputChange} className="w-full bg-gray-200 px-6 py-4 rounded-2xl outline-none font-bold text-sm border-2 border-gray-300 focus:border-blue-600 focus:bg-white transition-all text-gray-900 placeholder-gray-500" placeholder="Ej: Tarjeta, E-check, etc." />
                        </div>
                     )}

                     <div className="pt-6 border-t border-gray-50 mt-6">
                        <div className="flex justify-between items-end mb-6">
                           <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Total a Pagar</span>
                           <h4 className="text-3xl font-black text-gray-900 italic tracking-tighter">$ {totalPrice.toLocaleString('es-AR')}</h4>
                        </div>
                        <button type="submit" className="w-full bg-[#25d366] hover:bg-[#20ba5a] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                           <Send size={18} /> Pedir por WhatsApp
                        </button>
                     </div>
                  </form>
               </div>

               <div className="flex justify-center gap-4 text-gray-400">
                  <Wallet size={32} strokeWidth={1} />
                  <CreditCard size={32} strokeWidth={1} />
               </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] p-24 text-center shadow-2xl border border-gray-100 flex flex-col items-center animate-in fade-in duration-500">
             <div className="bg-gray-50 p-8 rounded-full mb-8">
                <ShoppingBag size={64} strokeWidth={1} className="text-gray-300" />
             </div>
             <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tighter italic mb-4">Tu carrito está vacío</h2>
             <p className="text-gray-400 font-bold mb-10 max-w-sm">Explorá nuestros productos y encontrá los mejores precios para tu negocio.</p>
             <Link to="/" className="bg-[#fff159] text-gray-800 px-12 py-5 rounded-2xl font-black uppercase text-xs shadow-xl shadow-yellow-500/10 hover:scale-105 active:scale-95 transition-all">Ver catálogo</Link>
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
