
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Servant } from '../types';
import { 
  UserCheck, UserPlus, Search, Phone, Shield, 
  Trash2, Edit3, Save, X, CheckCircle2, 
  MoreVertical, Filter, User
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

export const ServantsPage: React.FC = () => {
  const [servants, setServants] = useState<Servant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Servant>>({
    name: '',
    role: 'خادم',
    phone: '',
    responsibility: ''
  });

  const loadServants = () => {
    setServants(storageService.getServants());
  };

  useEffect(() => {
    loadServants();
    window.addEventListener('storage_updated', loadServants);
    return () => window.removeEventListener('storage_updated', loadServants);
  }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      alert('يرجى إدخال الاسم ورقم الهاتف');
      return;
    }

    if (editingId) {
      const updated = servants.map(s => 
        s.id === editingId ? { ...s, ...formData } as Servant : s
      );
      await storageService.saveServants(updated);
      setEditingId(null);
    } else {
      const newServant: Servant = {
        id: uuidv4(),
        name: formData.name!,
        role: formData.role || 'خادم',
        phone: formData.phone!,
        responsibility: formData.responsibility || '',
        addedAt: Date.now()
      };
      storageService.addServant(newServant);
      setIsAdding(false);
    }
    setFormData({ name: '', role: 'خادم', phone: '', responsibility: '' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الخادم؟')) {
      await storageService.deleteServant(id);
    }
  };

  const filteredServants = servants.filter(s => 
    s.name.includes(searchTerm) || 
    s.phone.includes(searchTerm) ||
    s.responsibility?.includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 font-['Cairo']">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white flex items-center gap-3">
             <UserCheck size={36} className="text-rose-500" /> سجل الخدام
          </h2>
          <p className="text-slate-500 font-bold mt-1">إدارة بيانات خدام الاجتماع ومسؤولياتهم.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-8 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-200 dark:shadow-none hover:bg-rose-700 transition-all"
        >
          <UserPlus size={20} /> إضافة خادم جديد
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Filter size={18} className="text-rose-500" /> بحث وتصفية
            </h3>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="ابحث بالاسم أو الهاتف..."
                className="w-full pr-12 pl-4 py-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 outline-none focus:border-rose-500 transition-all text-sm font-bold"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-[2rem] border border-rose-100 dark:border-rose-800/50">
            <h4 className="font-black text-rose-800 dark:text-rose-400 mb-2">إحصائيات سريعة</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-rose-600/70">إجمالي الخدام</span>
                <span className="text-xl font-black text-rose-700 dark:text-rose-300">{servants.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence>
            {isAdding && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-rose-100 dark:border-rose-900 shadow-xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">إضافة خادم جديد</h3>
                  <button onClick={() => setIsAdding(false)} className="p-2 text-slate-400 hover:text-rose-600"><X size={24} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-500 mr-2">الاسم بالكامل</label>
                    <input 
                      className="w-full px-5 py-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 outline-none focus:border-rose-500 font-bold"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-500 mr-2">رقم الهاتف</label>
                    <input 
                      className="w-full px-5 py-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 outline-none focus:border-rose-500 font-bold"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-500 mr-2">الصفة / الدور</label>
                    <select 
                      className="w-full px-5 py-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 outline-none focus:border-rose-500 font-bold"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="خادم">خادم</option>
                      <option value="أمين خدمة">أمين خدمة</option>
                      <option value="أمين مساعد">أمين مساعد</option>
                      <option value="أمين أسرة">أمين أسرة</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-500 mr-2">المسؤولية</label>
                    <input 
                      placeholder="مثال: مسؤول أسرة القديس أبانوب"
                      className="w-full px-5 py-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 outline-none focus:border-rose-500 font-bold"
                      value={formData.responsibility}
                      onChange={e => setFormData({...formData, responsibility: e.target.value})}
                    />
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-3">
                  <button onClick={() => setIsAdding(false)} className="px-6 py-3 text-slate-500 font-black">إلغاء</button>
                  <button onClick={handleSave} className="px-10 py-3 bg-rose-600 text-white rounded-xl font-black shadow-lg hover:bg-rose-700 transition-all">حفظ البيانات</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredServants.map(servant => (
              <motion.div 
                layout
                key={servant.id}
                className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
              >
                {editingId === servant.id ? (
                  <div className="space-y-4">
                    <input 
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-bold"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSave} className="flex-1 py-2 bg-emerald-500 text-white rounded-lg font-black flex items-center justify-center gap-2"><Save size={16}/> حفظ</button>
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg font-black">إلغاء</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600">
                        <User size={28} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 dark:text-white text-lg">{servant.name}</h4>
                        <div className="flex items-center gap-2 text-rose-600 mt-1">
                          <Shield size={14} />
                          <span className="text-xs font-black uppercase tracking-wider">{servant.role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => {
                        setEditingId(servant.id);
                        setFormData(servant);
                      }} className="p-2 text-slate-400 hover:text-blue-600"><Edit3 size={18}/></button>
                      <button onClick={() => handleDelete(servant.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={18}/></button>
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <Phone size={16} className="text-slate-400" />
                    <span className="text-sm font-bold">{servant.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <UserCheck size={16} className="text-slate-400" />
                    <span className="text-sm font-bold">{servant.responsibility || 'بدون مسؤولية محددة'}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredServants.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
              <UserCheck size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-xl font-black text-slate-400">لا يوجد خدام مسجلين بهذا البحث</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
