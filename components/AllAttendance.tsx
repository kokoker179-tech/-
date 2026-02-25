
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Youth, AttendanceRecord } from '../types';
import { Search, Calendar, X, Church, Users, Heart, BookOpen, ShieldCheck, Loader2 } from 'lucide-react';
import { formatDateArabic } from '../constants';

export const AllAttendance: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [youthMap, setYouthMap] = useState<Record<string, Youth>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadData = () => {
    const allRecords = storageService.getAttendance();
    const allYouth = storageService.getYouth();
    setRecords(allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    const map: Record<string, Youth> = {};
    allYouth.forEach(y => { map[y.id] = y; });
    setYouthMap(map);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage_updated', loadData);
    return () => window.removeEventListener('storage_updated', loadData);
  }, []);

  const handleDeleteRecord = async (id: string) => {
    const confirmDelete = window.confirm('⚠️ حذف سجل نهائي؟\nسوف يختفي هذا السجل من الأرشيف تماماً.');
    if (confirmDelete) {
      setIsDeleting(id);
      try {
        await storageService.deleteAttendanceRecord(id);
      } catch (err) {
        alert('حدث خطأ أثناء المسح.');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const filteredRecords = records.filter(record => {
    const youth = youthMap[record.youthId];
    if (!youth) return false;
    
    const matchesSearch = youth.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = filterMonth === 'all' || record.date.startsWith(filterMonth);
    
    return matchesSearch && matchesMonth;
  });

  const months = Array.from(new Set(records.map(r => r.date.substring(0, 7)))).sort().reverse();

  const Indicator = ({ active, icon: Icon, colorClass }: any) => (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? colorClass : 'bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700'}`}>
      <Icon size={16} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 dark:text-white">سجل الحضور الكامل</h2>
        <p className="text-slate-500 font-bold">الأرشيف التاريخي لكل الأيام السابقة.</p>
      </div>

      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative group flex-1">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={24} />
          <input
            type="text" placeholder="ابحث باسم الشاب..."
            className="w-full pl-6 pr-14 py-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white outline-none shadow-sm text-xl font-black transition-all"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-8 py-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white outline-none shadow-sm font-black text-lg cursor-pointer"
        >
          <option value="all">كل الشهور</option>
          {months.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <th className="px-8 py-5 font-black text-sm uppercase tracking-wider">الاسم</th>
                <th className="px-6 py-5 font-black text-sm uppercase tracking-wider">التاريخ</th>
                <th className="px-6 py-5 font-black text-sm uppercase tracking-wider text-center">التفاصيل</th>
                <th className="px-8 py-5 font-black text-sm uppercase tracking-wider text-center">مسح</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredRecords.map((record) => {
                const youth = youthMap[record.youthId];
                if (!youth) return null;
                const deletingThis = isDeleting === record.id;
                return (
                  <tr key={record.id} className={`hover:bg-blue-50/30 transition-colors ${deletingThis ? 'opacity-50' : ''}`}>
                    <td className="px-8 py-5">
                      <p className="font-black text-slate-800 dark:text-slate-200 text-lg">{youth.name}</p>
                      <p className="text-xs text-slate-400 font-black">{youth.grade}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold">
                        <Calendar size={16} className="text-blue-500" />
                        <span className="text-sm">{formatDateArabic(record.date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <Indicator active={record.liturgy} icon={Church} colorClass="bg-amber-100 text-amber-600" />
                        <Indicator active={record.meeting} icon={Users} colorClass="bg-emerald-100 text-emerald-600" />
                        <Indicator active={record.visitation} icon={Heart} colorClass="bg-red-100 text-red-600" />
                        <Indicator active={record.bibleReading} icon={BookOpen} colorClass="bg-blue-100 text-blue-600" />
                        <Indicator active={record.confession} icon={ShieldCheck} colorClass="bg-purple-100 text-purple-600" />
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button 
                        onClick={() => handleDeleteRecord(record.id)}
                        className="p-3 text-rose-400 hover:text-white hover:bg-rose-600 rounded-xl transition-all border border-transparent hover:border-rose-100"
                        title="حذف هذا السجل"
                      >
                        {deletingThis ? <Loader2 size={20} className="animate-spin" /> : <X size={20} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
