import { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { 
  MessageCircle, Mail, Phone, 
  Send, Loader2, CheckCircle2 
} from 'lucide-react';

export const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSent(false), 5000);
    }, 1500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openWhatsApp = () => {
    const phone = "5493415030742"; 
    window.open(`https://wa.me/${phone}?text=Hola! Quería hacer una consulta sobre...`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Info Section */}
          <div className="space-y-12">
            <div className="space-y-4">
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">¿Dudas o consultas?</span>
               <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-none tracking-tighter italic uppercase">CONTACTANOS</h1>
               <p className="text-xl text-gray-400 font-bold leading-relaxed max-w-md">Estamos listos para ayudarte a potenciar tu negocio con la mejor atención personalizada.</p>
            </div>

            <div className="space-y-8">
               <div className="flex items-center gap-6 group">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-black/5 group-hover:scale-110 transition-all">
                     <Phone className="text-blue-500" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Llamanos</p>
                     <p className="text-xl font-black text-gray-800 italic tracking-tighter cursor-pointer hover:text-blue-500">341 503-0742</p>
                  </div>
               </div>

               <div onClick={openWhatsApp} className="flex items-center gap-6 group cursor-pointer">
                  <div className="w-16 h-16 bg-[#25d366] rounded-3xl flex items-center justify-center shadow-xl shadow-green-500/10 group-hover:scale-110 transition-all">
                     <MessageCircle className="text-white" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">WhatsApp Directo</p>
                     <p className="text-xl font-black text-gray-800 italic tracking-tighter hover:text-[#25d366]">Escribinos por WhatsApp</p>
                  </div>
               </div>

               <div className="flex items-center gap-6 group">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-black/5 group-hover:scale-110 transition-all">
                     <Mail className="text-blue-500" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">E-mail</p>
                     <p className="text-xl font-black text-gray-800 italic tracking-tighter cursor-pointer hover:text-blue-500 text-sm md:text-xl">mgonzalez.lif@gmail.com</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-white p-12 rounded-[50px] shadow-2xl border border-gray-100 relative overflow-hidden">
             {sent && (
               <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500">
                  <CheckCircle2 size={64} className="text-green-500 mb-4" />
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic">¡Mensaje Enviado!</h3>
                  <p className="text-gray-400 font-bold mt-2">Te responderemos a la brevedad.</p>
               </div>
             )}

             <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter italic mb-8">Envianos un Mensaje</h3>
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-600 uppercase ml-4 tracking-widest">Tu Nombre</label>
                      <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-gray-200 px-6 py-4 rounded-2xl outline-none font-bold text-sm border-2 border-gray-300 focus:border-blue-600 focus:bg-white transition-all text-gray-900 placeholder-gray-500" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-600 uppercase ml-4 tracking-widest">Tu E-mail</label>
                      <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-gray-200 px-6 py-4 rounded-2xl outline-none font-bold text-sm border-2 border-gray-300 focus:border-blue-600 focus:bg-white transition-all text-gray-900 placeholder-gray-500" />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-600 uppercase ml-4 tracking-widest">Asunto</label>
                   <input required name="subject" value={formData.subject} onChange={handleInputChange} className="w-full bg-gray-200 px-6 py-4 rounded-2xl outline-none font-bold text-sm border-2 border-gray-300 focus:border-blue-600 focus:bg-white transition-all text-gray-900 placeholder-gray-500" />
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-600 uppercase ml-4 tracking-widest">Mensaje</label>
                   <textarea required name="message" rows={5} value={formData.message} onChange={handleInputChange} className="w-full bg-gray-200 px-6 py-4 rounded-2xl outline-none font-bold text-sm border-2 border-gray-300 focus:border-blue-600 focus:bg-white transition-all resize-none text-gray-900 placeholder-gray-500"></textarea>
                </div>

                <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                   {loading ? <Loader2 size={18} className="animate-spin text-white" /> : <><Send size={18} /> Enviar Mensaje</>}
                </button>
             </form>
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
