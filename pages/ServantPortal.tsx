import React, { useState, useEffect } from 'react';
import { UserCircle, User, X, Search, Loader2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Servant } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export const ServantPortal: React.FC = () => {
  const [servants, setServants] = useState<Servant[]>([]);
  const [servantCodeInput, setServantCodeInput] = useState('');
  const [viewedServant, setViewedServant] = useState<Servant | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setServants(storageService.getServants());
  }, []);

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      const s = servants.find(s => s.code === servantCodeInput);
      if (s) {
        setViewedServant(s);
      } else {
        alert('الكود غير صحيح أو غير موجود');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 font-['Cairo']">
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100 rotate-3">
          <UserCircle size={48} />
        </div>
        <h2 className="text-4xl font-black text-slate-800 mb-4">بوابة الخادم</h2>
        <p className="text-slate-500 font-bold text-lg">أدخل كود الخادم الخاص بك المكون من 5 أرقام لعرض بياناتك</p>
      </div>

      <AnimatePresence mode="wait">
        {!viewedServant ? (
          <motion.div 
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-10 rounded-[3rem] shadow-xl border-2 border-slate-50"
          >
            <div className="space-y-8">
              <div className="relative">
                <input 
                  type="text"
                  maxLength={5}
                  placeholder="00000"
                  className="w-full px-8 py-8 rounded-[2rem] border-4 border-slate-100 bg-slate-50 outline-none focus:border-blue-500 text-center font-black text-5xl tracking-[0.5em] transition-all placeholder:text-slate-200"
                  value={servantCodeInput}
                  onChange={e => setServantCodeInput(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>
              
              <button 
                onClick={handleSearch}
                disabled={loading || servantCodeInput.length !== 5}
                className={`w-full py-6 rounded-[2rem] font-black text-2xl shadow-xl transition-all flex items-center justify-center gap-3 ${
                  loading || servantCodeInput.length !== 5 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02] active:scale-95'
                }`}
              >
                {loading ? <Loader2 className="animate-spin" size={28} /> : <Search size={28} />}
                عرض بياناتي
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-blue-50 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
            
            <div className="flex justify-between items-start mb-10">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner">
                  <User size={40} />
                </div>
                <div>
                  <h4 className="text-3xl font-black text-slate-800 mb-1">{viewedServant.name}</h4>
                  <span className="px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-black uppercase tracking-wider">
                    {viewedServant.role}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => { setViewedServant(null); setServantCodeInput(''); }} 
                className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
              >
                <X size={28} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">كود الخادم</p>
                <p className="text-3xl font-black text-slate-800 tracking-[0.2em]">{viewedServant.code}</p>
              </div>
              
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">رقم الهاتف</p>
                <p className="text-2xl font-black text-slate-800">{viewedServant.phone}</p>
              </div>
              
              {viewedServant.responsibility && (
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <p className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">المسؤولية</p>
                  <p className="text-xl font-black text-slate-800">{viewedServant.responsibility}</p>
                </div>
              )}
              
              <Link 
                to={`/servant-profile/${viewedServant.id}`}
                className="mt-4 block w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-center text-xl hover:bg-blue-600 transition-all shadow-lg"
              >
                عرض السجل الكامل والمتابعة
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-12 text-center">
        <p className="text-slate-400 font-bold text-sm">إذا فقدت الكود الخاص بك، يرجى مراجعة أمين الخدمة</p>
      </div>
    </div>
  );
};
