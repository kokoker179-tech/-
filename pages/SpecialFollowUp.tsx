import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, Lock, LogOut, User, Check, X, 
  Calendar, Clock, CheckCircle2, XCircle, Plus, Edit3, Trash2, Search, RefreshCw, Power, UserCircle,
  Users, Heart, Download, ChevronLeft, ChevronRight, MessageSquare, MapPin, Phone, Hash, TrendingUp, UserPlus, Camera
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Servant, AttendanceRecord, Youth, Visitation, ServantAttendance } from '../types';
import { formatDateArabic, getActiveFriday, generateServantsPDF } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

export const SpecialFollowUp: React.FC = () => {
  const [servants, setServants] = useState<Servant[]>([]);
  const [youth, setYouth] = useState<Youth[]>([]);
  const [servantAttendance, setServantAttendance] = useState<ServantAttendance[]>([]);
  const [visitations, setVisitations] = useState<Visitation[]>([]);
  const [selectedDate, setSelectedDate] = useState(getActiveFriday());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'attendance' | 'servants'>('dashboard');
  
  // Visitation State
  const [isAddingVisitation, setIsAddingVisitation] = useState(false);
  const [activeServantId, setActiveServantId] = useState<string | null>(null);
  const [visitationForm, setVisitationForm] = useState({
    youthId: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [youthSearch, setYouthSearch] = useState('');

  // Management State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const servantImageRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Servant>>({
    name: '', role: 'خادم', phone: '', code: '', responsibility: '', image: '', address: ''
  });

  const generateServantCode = () => {
    const existingCodes = servants.map(s => s.code);
    let newCode = '';
    do {
      newCode = Math.floor(10000 + Math.random() * 90000).toString();
    } while (existingCodes.includes(newCode));
    return newCode;
  };

  const handleServantImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setFormData(prev => ({ ...prev, image: canvas.toDataURL('image/jpeg', 0.7) }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const loadData = () => {
    setServants(storageService.getServants());
    setYouth(storageService.getYouth());
    setServantAttendance(storageService.getServantAttendance());
    setVisitations(storageService.getVisitations());
  };

  const currentAttendance = servantAttendance.filter(r => r.date === selectedDate);
  const currentVisitations = visitations.filter(v => v.date === selectedDate);

  const stats = useMemo(() => {
    const total = servants.length;
    const presentLiturgy = currentAttendance.filter(r => r.liturgy).length;
    const presentMeeting = currentAttendance.filter(r => r.meeting).length;
    const totalVisits = currentVisitations.length;
    return { total, presentLiturgy, presentMeeting, totalVisits };
  }, [servants, currentAttendance, currentVisitations]);

  useEffect(() => {
    loadData();
    window.addEventListener('storage_updated', loadData);
    return () => window.removeEventListener('storage_updated', loadData);
  }, []);

  const updateAttendance = async (servantId: string, field: 'liturgy' | 'meeting' | 'preparation', value: boolean) => {
    if (selectedDate > new Date().toISOString().split('T')[0]) {
      alert('لا يمكن تسجيل حضور لتاريخ مستقبلي');
      return;
    }

    const all = storageService.getServantAttendance();
    const existingIdx = all.findIndex(r => r.servantId === servantId && r.date === selectedDate);
    
    if (existingIdx > -1) {
      all[existingIdx] = { ...all[existingIdx], [field]: value, timestamp: Date.now() };
    } else {
      all.push({
        id: uuidv4(),
        servantId,
        date: selectedDate,
        liturgy: field === 'liturgy' ? value : false,
        meeting: field === 'meeting' ? value : false,
        preparation: field === 'preparation' ? value : false,
        timestamp: Date.now()
      });
    }

    setLoading(true);
    await storageService.saveServantAttendance(all);
    setLoading(false);
  };

  const handleAddVisitation = async () => {
    if (!activeServantId || !visitationForm.youthId) {
      alert('يرجى اختيار الشاب');
      return;
    }

    const newVisit: Visitation = {
      id: uuidv4(),
      servantId: activeServantId,
      youthId: visitationForm.youthId,
      date: visitationForm.date,
      notes: visitationForm.notes,
      timestamp: Date.now()
    };

    setLoading(true);
    storageService.addVisitation(newVisit);
    setIsAddingVisitation(false);
    setVisitationForm({ youthId: '', notes: '', date: new Date().toISOString().split('T')[0] });
    setYouthSearch('');
    setActiveServantId(null);
    setLoading(false);
  };

  const handleSaveServant = async () => {
    if (!formData.name || !formData.phone) {
      alert('يرجى إكمال البيانات الأساسية');
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
        code: formData.code || generateServantCode(),
        responsibility: formData.responsibility || '',
        image: formData.image || '',
        address: formData.address || '',
        addedAt: Date.now()
      };
      storageService.addServant(newServant);
    }
    setFormData({ name: '', role: 'خادم', phone: '', code: '', responsibility: '', image: '', address: '' });
    setIsAdding(false);
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-3 bg-white p-3 rounded-[2rem] border border-slate-100 shadow-lg">
          <button onClick={() => changeWeek('prev')} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-amber-600 transition-all">
            <ChevronRight size={24} />
          </button>
          <div className="px-8 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إحصائيات أسبوع</p>
            <p className="font-black text-slate-800 text-lg">{formatDateArabic(selectedDate)}</p>
          </div>
          <button onClick={() => changeWeek('next')} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-amber-600 transition-all">
            <ChevronLeft size={24} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي الخدام</span>
          </div>
          <div>
            <h4 className="text-4xl font-black text-slate-800">{stats.total}</h4>
            <p className="text-slate-400 text-xs font-bold mt-1">خادم مسجل في النظام</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">حضور القداس</span>
          </div>
          <div>
            <h4 className="text-4xl font-black text-emerald-600">{stats.presentLiturgy}</h4>
            <p className="text-slate-400 text-xs font-bold mt-1">خادم حضر قداس اليوم</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <Heart size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الافتقاد</span>
          </div>
          <div>
            <h4 className="text-4xl font-black text-amber-600">{stats.totalVisits}</h4>
            <p className="text-slate-400 text-xs font-bold mt-1">عملية افتقاد تمت اليوم</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500" /> خدام حضروا القداس
            </h3>
          </div>
          <div className="p-6 space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
            {currentAttendance.filter(r => r.liturgy).length === 0 ? (
              <p className="text-center py-8 text-slate-400 font-bold">لم يتم تسجيل حضور قداس بعد</p>
            ) : (
              currentAttendance.filter(r => r.liturgy).map(r => {
                const s = servants.find(item => item.id === r.servantId);
                return (
                  <div key={r.id} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <span className="font-bold text-emerald-800">{s?.name}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Users size={20} className="text-blue-500" /> خدام حضروا الاجتماع
            </h3>
          </div>
          <div className="p-6 space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
            {currentAttendance.filter(r => r.meeting).length === 0 ? (
              <p className="text-center py-8 text-slate-400 font-bold">لم يتم تسجيل حضور اجتماع بعد</p>
            ) : (
              currentAttendance.filter(r => r.meeting).map(r => {
                const s = servants.find(item => item.id === r.servantId);
                return (
                  <div key={r.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <span className="font-bold text-blue-800">{s?.name}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const changeWeek = (direction: 'prev' | 'next') => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
    const dateStr = d.toISOString().split('T')[0];
    if (dateStr >= '2026-02-27') {
      setSelectedDate(dateStr);
    }
  };

  const isFutureDate = selectedDate > new Date().toISOString().split('T')[0];

  const renderAttendance = () => (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <Calendar size={20} className="text-amber-600" /> السجل الكامل (حضور وافتقاد)
        </h3>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <button onClick={() => changeWeek('prev')} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-amber-600 transition-all">
            <ChevronRight size={20} />
          </button>
          <div className="px-4 font-black text-slate-700 text-sm">
            {formatDateArabic(selectedDate)}
            {isFutureDate && <span className="mr-2 text-rose-500 text-[10px]">(مستقبلي)</span>}
          </div>
          <button onClick={() => changeWeek('next')} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-amber-600 transition-all">
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <th className="px-6 py-4">الخادم</th>
              <th className="px-6 py-4 text-center">قداس</th>
              <th className="px-6 py-4 text-center">اجتماع</th>
              <th className="px-6 py-4 text-center">تحضير</th>
              <th className="px-6 py-4 text-center">الافتقاد</th>
              <th className="px-6 py-4 text-center">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredServants.map(servant => {
              const record = currentAttendance.find(r => r.servantId === servant.id);
              const isLiturgy = record?.liturgy || false;
              const isMeeting = record?.meeting || false;
              const isPreparation = record?.preparation || false;
              
              // Find visitations for this servant in the week of selectedDate
              // A week is defined as selectedDate (Friday) and the 6 days before it
              const weekStart = new Date(selectedDate);
              weekStart.setDate(weekStart.getDate() - 6);
              const weekStartStr = weekStart.toISOString().split('T')[0];
              
              const servantVisits = visitations.filter(v => 
                v.servantId === servant.id && 
                v.date >= weekStartStr && 
                v.date <= selectedDate
              );

              return (
                <tr key={servant.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{servant.name}</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase">{servant.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button 
                        disabled={isFutureDate}
                        onClick={() => updateAttendance(servant.id, 'liturgy', !isLiturgy)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isLiturgy ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-300'} ${isFutureDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isLiturgy ? <Check size={20} strokeWidth={3} /> : <X size={20} strokeWidth={3} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button 
                        disabled={isFutureDate}
                        onClick={() => updateAttendance(servant.id, 'meeting', !isMeeting)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isMeeting ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-300'} ${isFutureDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isMeeting ? <Check size={20} strokeWidth={3} /> : <X size={20} strokeWidth={3} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button 
                        disabled={isFutureDate}
                        onClick={() => updateAttendance(servant.id, 'preparation', !isPreparation)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isPreparation ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-100 text-slate-300'} ${isFutureDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isPreparation ? <Check size={20} strokeWidth={3} /> : <X size={20} strokeWidth={3} />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1">
                      <button 
                        disabled={isFutureDate}
                        onClick={() => {
                          setActiveServantId(servant.id);
                          setIsAddingVisitation(true);
                        }}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-xs font-black ${servantVisits.length > 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-400'} ${isFutureDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Heart size={14} className={servantVisits.length > 0 ? 'fill-amber-500' : ''} />
                        {servantVisits.length > 0 ? `افتقد ${servantVisits.length}` : 'تسجيل افتقاد'}
                      </button>
                      {servantVisits.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 max-w-[180px]">
                          {servantVisits.map(v => {
                            const y = youth.find(item => item.id === v.youthId);
                            const visitDay = new Date(v.date).toLocaleDateString('ar-EG', { weekday: 'short' });
                            return (
                              <span key={v.id} className="text-[8px] bg-white border px-1 rounded text-slate-500 truncate max-w-[80px]" title={`${y?.name} - ${visitDay}`}>
                                {y?.name.split(' ')[0]} ({visitDay})
                              </span>
                            );
                          })}
                        </div>
                      )}
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
      </div>

      {/* Unified Visitation Modal */}
      <AnimatePresence>
        {isAddingVisitation && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 bg-amber-600 text-white">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <Heart /> تسجيل افتقاد جديد
                </h3>
                <p className="text-amber-100 font-bold mt-2">
                  الخادم: {servants.find(s => s.id === activeServantId)?.name}
                </p>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">الشاب المفتقد</label>
                  <div className="relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text"
                      placeholder="ابحث عن الشاب بالاسم أو الكود..."
                      className="w-full pr-12 pl-6 py-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-bold"
                      value={youthSearch}
                      onChange={e => setYouthSearch(e.target.value)}
                    />
                    {youthSearch && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-20 max-h-48 overflow-y-auto p-2">
                        {youth
                          .filter(y => y.name.includes(youthSearch) || y.code.includes(youthSearch))
                          .slice(0, 5)
                          .map(y => (
                            <button 
                              key={y.id}
                              onClick={() => {
                                setVisitationForm({...visitationForm, youthId: y.id});
                                setYouthSearch(y.name);
                              }}
                              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-right ${visitationForm.youthId === y.id ? 'bg-amber-50 text-amber-600' : 'hover:bg-slate-50'}`}
                            >
                              <div className="flex flex-col items-start">
                                <span className="font-bold text-slate-700">{y.name}</span>
                                <span className="text-[10px] text-slate-400 font-black">{y.code}</span>
                              </div>
                              {visitationForm.youthId === y.id && <Check size={16} />}
                            </button>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">تاريخ الافتقاد</label>
                    <input 
                      type="date"
                      className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-bold"
                      value={visitationForm.date}
                      onChange={e => setVisitationForm({...visitationForm, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">ملاحظات</label>
                    <input 
                      placeholder="مثال: مكالمة تليفونية"
                      className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-bold"
                      value={visitationForm.notes}
                      onChange={e => setVisitationForm({...visitationForm, notes: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={handleAddVisitation}
                    className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-black shadow-lg hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={20} /> تأكيد التسجيل
                  </button>
                  <button 
                    onClick={() => {
                      setIsAddingVisitation(false);
                      setActiveServantId(null);
                      setYouthSearch('');
                    }}
                    className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderServants = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-slate-800">قائمة الخدام</h3>
        <div className="flex gap-3">
          <button 
            onClick={() => generateServantsPDF(servants)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all"
          >
            <Download size={20} /> تحميل PDF
          </button>
          <button 
            onClick={() => { 
              setIsAdding(true); 
              setEditingId(null); 
              setFormData({ 
                name: '', 
                role: 'خادم', 
                phone: '', 
                code: generateServantCode(), 
                responsibility: '',
                image: '',
                address: ''
              }); 
            }} 
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all"
          >
            <Plus size={20} /> إضافة خادم
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServants.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 group-hover:bg-blue-100 transition-colors"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center text-blue-600 overflow-hidden">
                  {s.image ? (
                    <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle size={32} />
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingId(s.id); setFormData(s); setIsAdding(true); }} className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Edit3 size={16}/></button>
                  <button onClick={() => { if(window.confirm('حذف الخادم؟')) storageService.deleteServant(s.id); }} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>
              <Link to={`/servant-profile/${s.id}`}>
                <h4 className="font-black text-xl text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{s.name}</h4>
              </Link>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{s.role}</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                  <Phone size={14} className="text-slate-300" /> {s.phone}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                  <Hash size={14} className="text-slate-300" /> {s.code}
                </div>
                {s.address && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                    <MapPin size={14} className="text-slate-300" /> {s.address}
                  </div>
                )}
                {s.responsibility && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                    <ShieldCheck size={14} className="text-slate-300" /> {s.responsibility}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Servant Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 bg-blue-600 text-white">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <UserPlus /> {editingId ? 'تعديل بيانات خادم' : 'إضافة خادم جديد'}
                </h3>
              </div>
              <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="flex flex-col items-center mb-4">
                  <div 
                    className="relative w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer group"
                    onClick={() => servantImageRef.current?.click()}
                  >
                    {formData.image ? (
                      <>
                        <img src={formData.image} alt="معاينة" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="text-white" size={20} />
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-slate-400 group-hover:text-blue-500 transition-colors">
                        <Camera size={24} className="mx-auto mb-1" />
                        <span className="text-[10px] font-black">إضافة صورة</span>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={servantImageRef} className="hidden" accept="image/*" onChange={handleServantImageChange} />
                </div>

                <input 
                  placeholder="الاسم بالكامل"
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    placeholder="رقم الهاتف"
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                  <div className="relative">
                    <Hash className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      placeholder="الكود"
                      readOnly
                      className="w-full px-5 pr-10 py-3 rounded-xl border border-slate-100 bg-slate-50 outline-none font-black text-slate-500 cursor-not-allowed"
                      value={formData.code}
                    />
                  </div>
                </div>
                <select 
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="خادم">خادم</option>
                  <option value="أمين خدمة">أمين خدمة</option>
                  <option value="أمين مساعد">أمين مساعد</option>
                  <option value="أمين أسرة">أمين أسرة</option>
                </select>
                <input 
                  placeholder="العنوان"
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
                <input 
                  placeholder="المسؤولية (اختياري)"
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold"
                  value={formData.responsibility}
                  onChange={e => setFormData({...formData, responsibility: e.target.value})}
                />
                <div className="flex gap-3 pt-4">
                  <button onClick={handleSaveServant} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all">حفظ البيانات</button>
                  <button onClick={() => setIsAdding(false)} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all">إلغاء</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  const filteredServants = servants.filter(s => s.name.includes(searchTerm));

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 font-['Cairo'] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-[3rem] p-10 text-white mb-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">المتابعة الخاصة</span>
              <span className="px-3 py-1 bg-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest">لوحة التحكم</span>
            </div>
            <h2 className="text-5xl font-black mb-4">نظام متابعة الخدام</h2>
            <div className="flex items-center gap-6 text-amber-100 font-bold">
              <div className="flex items-center gap-2"><Calendar size={18} /> {formatDateArabic(selectedDate)}</div>
              <div className="flex items-center gap-2"><Users size={18} /> {servants.length} خادم</div>
            </div>
          </div>
          <button 
            onClick={() => {
              storageService.logout();
              window.location.reload();
            }}
            className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all font-black flex items-center gap-2"
          >
            <Power size={20} /> خروج
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-4 mb-10">
        <TabButton active={viewMode === 'dashboard'} onClick={() => setViewMode('dashboard')} icon={TrendingUp} label="لوحة التحكم" />
        <TabButton active={viewMode === 'attendance'} onClick={() => setViewMode('attendance')} icon={Calendar} label="السجل الكامل" />
        <TabButton active={viewMode === 'servants'} onClick={() => setViewMode('servants')} icon={Users} label="قائمة الخدام" />
      </div>

      {/* Search Bar for non-dashboard views */}
      {viewMode !== 'dashboard' && (
        <div className="relative mb-8">
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="بحث في النظام..." 
            className="w-full pr-16 pl-8 py-5 rounded-[2rem] border-2 border-slate-100 text-lg font-bold outline-none focus:border-amber-500 bg-white shadow-sm transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === 'dashboard' && renderDashboard()}
          {viewMode === 'attendance' && renderAttendance()}
          {viewMode === 'servants' && renderServants()}
        </motion.div>
      </AnimatePresence>

      {loading && (
        <div className="fixed bottom-10 left-10 bg-slate-900 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl z-50">
          <RefreshCw className="animate-spin text-amber-400" size={20} />
          <span className="font-black text-xs">جاري المزامنة...</span>
        </div>
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all ${
      active 
        ? 'bg-amber-600 text-white shadow-xl shadow-amber-200 translate-y-[-2px]' 
        : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
    }`}
  >
    <Icon size={20} />
    {label}
  </button>
);
