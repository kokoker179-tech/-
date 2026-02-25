import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, LogOut, User, Check, X, 
  Calendar, Clock, CheckCircle2, XCircle, Plus, Edit3, Trash2, Search, RefreshCw, Power, UserCircle
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Servant, AttendanceRecord } from '../types';
import { formatDateArabic, getActiveFriday } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export const SpecialFollowUp: React.FC = () => {
  const [servants, setServants] = useState<Servant[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(getActiveFriday());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  
  // Management State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Servant>>({
    name: '', role: 'خادم', phone: '', code: '', responsibility: ''
  });

  const loadData = () => {
    const allServants = storageService.getServants();
    setServants(allServants);
    const allRecords = storageService.getAttendance();
    setRecords(allRecords); // Load all records for weekly view
  };

  const currentRecords = records.filter(r => r.date === selectedDate);

  const getStats = () => {
    const total = servants.length;
    const presentLiturgy = currentRecords.filter(r => r.liturgy).length;
    const presentMeeting = currentRecords.filter(r => r.meeting).length;
    return { total, presentLiturgy, presentMeeting };
  };

  const stats = getStats();

  useEffect(() => {
    loadData();
    window.addEventListener('storage_updated', loadData);
    return () => window.removeEventListener('storage_updated', loadData);
  }, [selectedDate]);

  const updateAttendance = async (servantId: string, field: 'liturgy' | 'meeting', value: boolean) => {
    const all = storageService.getAttendance();
    const existing = all.find(r => r.servantId === servantId && r.date === selectedDate);
    let newRecord: AttendanceRecord;

    if (existing) {
      newRecord = { ...existing, [field]: value };
    } else {
      newRecord = {
        id: `${servantId}-${selectedDate}`,
        servantId,
        date: selectedDate,
        liturgy: field === 'liturgy' ? value : false,
        meeting: field === 'meeting' ? value : false,
        visitation: false,
        bibleReading: false,
        confession: false,
        communion: false
      };
    }

    const idx = all.findIndex(r => r.servantId === servantId && r.date === selectedDate);
    if (idx > -1) all[idx] = newRecord;
    else all.push(newRecord);

    setLoading(true);
    await storageService.saveAttendance(all);
    setLoading(false);
  };

  const handleSaveServant = async () => {
    if (!formData.name || !formData.phone || !formData.code) {
      alert('يرجى إكمال البيانات الأساسية');
      return;
    }
    if (formData.code.length !== 5 || !/^\d+$/.test(formData.code)) {
      alert('الكود يجب أن يكون 5 أرقام');
      return;
    }

    if (editingId) {
      const updated = servants.map(s => s.id === editingId ? { ...s, ...formData } as Servant : s);
      await storageService.saveServants(updated);
      setEditingId(null);
    } else {
      const newServant: Servant = {
        id: uuidv4(),
        name: formData.name!,
        role: formData.role || 'خادم',
        phone: formData.phone!,
        code: formData.code!,
        responsibility: formData.responsibility || '',
        addedAt: Date.now()
      };
      storageService.addServant(newServant);
    }
    setFormData({ name: '', role: 'خادم', phone: '', code: '', responsibility: '' });
    setIsAdding(false);
  };

  const filteredServants = servants.filter(s => s.name.includes(searchTerm));

  // Get last 4 Fridays for weekly view
  const getLastFridays = () => {
    const fridays = [];
    let d = new Date(selectedDate);
    // Adjust to Friday if not already
    while(d.getDay() !== 5) d.setDate(d.getDate() - 1);
    
    for(let i = 0; i < 4; i++) {
      fridays.push(d.toISOString().split('T')[0]);
      d.setDate(d.getDate() - 7);
    }
    return fridays;
  };

  const lastFridays = getLastFridays();

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 font-['Cairo'] pb-24">
      {/* Logout Button for Standalone Mode */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => {
            storageService.logout();
            window.location.reload();
          }}
          className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-600 hover:text-white transition-all shadow-sm"
        >
          <Power size={18} />
          <span>خروج من النظام</span>
        </button>
      </div>

      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50 flex items-center gap-6">
          <div className="w-16 h-16 bg-amber-600 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-amber-100">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800">المتابعة الخاصة</h2>
            <p className="text-amber-600 font-black">{formatDateArabic(selectedDate)}</p>
          </div>
        </div>

        <div className="bg-emerald-500 p-6 rounded-[2rem] text-white shadow-lg shadow-emerald-100 flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase opacity-80 mb-1">حضور القداس</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black">{stats.presentLiturgy}</span>
            <span className="text-sm font-bold opacity-60 mb-1">/ {stats.total}</span>
          </div>
        </div>

        <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-lg shadow-blue-100 flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase opacity-80 mb-1">حضور الاجتماع</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black">{stats.presentMeeting}</span>
            <span className="text-sm font-bold opacity-60 mb-1">/ {stats.total}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setViewMode('daily')}
            className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all ${viewMode === 'daily' ? 'bg-amber-600 text-white shadow-lg shadow-amber-100' : 'text-slate-400 hover:text-slate-600'}`}
          >
            تسجيل يومي
          </button>
          <button 
            onClick={() => setViewMode('weekly')}
            className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all ${viewMode === 'weekly' ? 'bg-amber-600 text-white shadow-lg shadow-amber-100' : 'text-slate-400 hover:text-slate-600'}`}
          >
            سجل أسبوعي
          </button>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {viewMode === 'daily' && (
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              className="flex-1 md:flex-none px-6 py-3 rounded-2xl border-2 border-slate-100 font-black text-sm outline-none focus:border-amber-500 bg-white shadow-sm"
            />
          )}
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث في سجل الخدام..." 
            className="w-full pr-12 pl-6 py-3 rounded-2xl border-2 border-slate-100 text-sm font-bold outline-none focus:border-amber-500 bg-white shadow-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Attendance Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Calendar size={20} className="text-amber-600" /> {viewMode === 'daily' ? 'سجل حضور الخدام' : 'السجل الأسبوعي للخدام'}
              </h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100">
                {filteredServants.length} خادم مسجل
              </span>
            </div>

            {viewMode === 'daily' ? (
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-6 py-4">الخادم</th>
                    <th className="px-6 py-4 text-center">قداس</th>
                    <th className="px-6 py-4 text-center">اجتماع</th>
                    <th className="px-6 py-4 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredServants.map(servant => {
                    const record = currentRecords.find(r => r.servantId === servant.id);
                    const isLiturgy = record?.liturgy || false;
                    const isMeeting = record?.meeting || false;

                    return (
                      <tr key={servant.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <Link to={`/servant-profile/${servant.id}`} className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-all">
                              <User size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm group-hover:text-amber-600 transition-colors">{servant.name}</p>
                              <p className="text-[9px] text-slate-400 font-black uppercase">{servant.role} - {servant.code}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button 
                              onClick={() => updateAttendance(servant.id, 'liturgy', !isLiturgy)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isLiturgy ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-300'}`}
                            >
                              {isLiturgy ? <Check size={20} strokeWidth={3} /> : <X size={20} strokeWidth={3} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button 
                              onClick={() => updateAttendance(servant.id, 'meeting', !isMeeting)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isMeeting ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-300'}`}
                            >
                              {isMeeting ? <Check size={20} strokeWidth={3} /> : <X size={20} strokeWidth={3} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isLiturgy && isMeeting ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black">
                              <CheckCircle2 size={10} /> التزام كامل
                            </span>
                          ) : isLiturgy || isMeeting ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black">
                              <Clock size={10} /> جزئي
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black">
                              <XCircle size={10} /> غياب
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="px-6 py-4 sticky right-0 bg-slate-50 z-10">الخادم</th>
                      {lastFridays.map(date => (
                        <th key={date} className="px-4 py-4 text-center border-r border-slate-100/50">
                          {formatDateArabic(date).split(' ').slice(0, 2).join(' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredServants.map(servant => (
                      <tr key={servant.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 sticky right-0 bg-white group-hover:bg-slate-50 z-10 border-l border-slate-50 shadow-[4px_0_8px_rgba(0,0,0,0.02)]">
                          <p className="font-bold text-slate-800 text-xs">{servant.name}</p>
                          <p className="text-[8px] text-slate-400 font-black">{servant.role}</p>
                        </td>
                        {lastFridays.map(date => {
                          const record = records.find(r => r.servantId === servant.id && r.date === date);
                          const isPresent = record?.liturgy || record?.meeting;
                          return (
                            <td key={date} className="px-4 py-4 text-center border-r border-slate-50/50">
                              <div className="flex flex-col items-center gap-1">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isPresent ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-50 text-rose-300'}`}>
                                  {isPresent ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                                </div>
                                {record && (
                                  <div className="flex gap-1">
                                    <div className={`w-2 h-2 rounded-full ${record.liturgy ? 'bg-emerald-500' : 'bg-slate-200'}`} title="قداس" />
                                    <div className={`w-2 h-2 rounded-full ${record.meeting ? 'bg-blue-500' : 'bg-slate-200'}`} title="اجتماع" />
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Management */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">إدارة الخدام</h3>
              <button onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ name: '', role: 'خادم', phone: '', code: '', responsibility: '' }); }} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
                <Plus size={20} />
              </button>
            </div>

            <AnimatePresence>
              {isAdding && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 mb-8 overflow-hidden"
                >
                  <input 
                    placeholder="الاسم بالكامل"
                    className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 outline-none focus:border-rose-500 font-bold text-sm"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      placeholder="رقم الهاتف"
                      className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 outline-none focus:border-rose-500 font-bold text-sm"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                    <input 
                      placeholder="الكود (5 أرقام)"
                      maxLength={5}
                      className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 outline-none focus:border-rose-500 font-bold text-sm"
                      value={formData.code}
                      onChange={e => setFormData({...formData, code: e.target.value.replace(/\D/g, '')})}
                    />
                  </div>
                  <select 
                    className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 outline-none focus:border-rose-500 font-bold text-sm"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="خادم">خادم</option>
                    <option value="أمين خدمة">أمين خدمة</option>
                    <option value="أمين مساعد">أمين مساعد</option>
                    <option value="أمين أسرة">أمين أسرة</option>
                  </select>
                  <input 
                    placeholder="المسؤولية (اختياري)"
                    className="w-full px-5 py-3 rounded-xl border border-slate-100 bg-slate-50 outline-none focus:border-rose-500 font-bold text-sm"
                    value={formData.responsibility}
                    onChange={e => setFormData({...formData, responsibility: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveServant} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black shadow-lg hover:bg-rose-700 transition-all">حفظ</button>
                    <button onClick={() => setIsAdding(false)} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-black">إلغاء</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              {servants.map(s => (
                <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group">
                  <div>
                    <p className="font-black text-slate-800 text-sm">{s.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{s.role} • {s.code}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/servant-profile/${s.id}`} className="p-1.5 text-slate-400 hover:text-amber-600"><UserCircle size={14}/></Link>
                    <button onClick={() => { setEditingId(s.id); setFormData(s); setIsAdding(true); }} className="p-1.5 text-slate-400 hover:text-blue-600"><Edit3 size={14}/></button>
                    <button onClick={() => storageService.deleteServant(s.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed bottom-10 left-10 bg-slate-900 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl z-50">
          <RefreshCw className="animate-spin text-amber-400" size={20} />
          <span className="font-black text-xs">جاري المزامنة...</span>
        </div>
      )}
    </div>
  );
};
