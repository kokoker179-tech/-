import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Search, User, Phone, Shield, 
  ChevronRight, ExternalLink, Filter, Loader2
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Servant } from '../types';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const ServantsPage: React.FC = () => {
  const [servants, setServants] = useState<Servant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = storageService.getServants();
    setServants(data);
    setLoading(false);
  }, []);

  const filteredServants = servants.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.code.includes(searchTerm);
    const matchesFilter = filter === 'all' || s.role === filter;
    return matchesSearch && matchesFilter;
  });

  const roles = ['خادم', 'أمين خدمة', 'أمين مساعد', 'أمين أسرة'];

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 font-['Cairo'] pb-24">
      {/* Header Section */}
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50 mb-10 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-rose-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-rose-100 rotate-3">
            <UserCheck size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-800">بوابة متابعة شباب الاجتماع</h2>
            <p className="text-slate-500 font-bold text-lg mt-1">دليل خدام الاجتماع وبياناتهم</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-2 rounded-2xl w-full md:w-auto overflow-x-auto">
          <button 
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${filter === 'all' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            الكل
          </button>
          {roles.map(role => (
            <button 
              key={role}
              onClick={() => setFilter(role)}
              className={`px-6 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${filter === role ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-12">
        <Search className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400" size={28} />
        <input 
          type="text" 
          placeholder="ابحث بالاسم أو الكود..." 
          className="w-full pr-20 pl-8 py-8 rounded-[2.5rem] border-4 border-slate-50 bg-white outline-none text-2xl font-black focus:border-rose-500 transition-all shadow-sm placeholder:text-slate-300"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-rose-600" size={48} />
          <p className="text-slate-400 font-black">جاري تحميل البيانات...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServants.map((servant, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={servant.id} 
              className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-rose-100 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex items-center gap-5 mb-8">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-600 transition-all">
                  <User size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800 group-hover:text-rose-600 transition-colors">{servant.name}</h4>
                  <span className="text-xs font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    {servant.role}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Shield size={18} />
                    <span className="text-xs font-black">الكود</span>
                  </div>
                  <span className="font-black text-slate-800 tracking-widest">{servant.code}</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Phone size={18} />
                    <span className="text-xs font-black">الهاتف</span>
                  </div>
                  <span className="font-black text-slate-800">{servant.phone}</span>
                </div>

                {servant.responsibility && (
                  <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                    <p className="text-[10px] font-black text-rose-400 uppercase mb-1 tracking-widest">المسؤولية</p>
                    <p className="text-sm font-black text-rose-700">{servant.responsibility}</p>
                  </div>
                )}
              </div>

              <Link 
                to={`/servant-profile/${servant.id}`}
                className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-rose-600 transition-all shadow-lg"
              >
                <ExternalLink size={18} />
                عرض الملف الكامل
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredServants.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search size={32} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-400">لم يتم العثور على نتائج</h3>
          <p className="text-slate-300 font-bold mt-2">جرب البحث بكلمات أخرى أو تغيير الفلتر</p>
        </div>
      )}
    </div>
  );
};
