
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Youth, AttendanceRecord } from '../types';
import { Search, Calendar, X, Church, Users, Heart, BookOpen, ShieldCheck, Loader2, Wine, Shirt } from 'lucide-react';
import { formatDateArabic, getActiveFriday, getAllFridaysSinceStart } from '../constants';

export const AllAttendance: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [youthMap, setYouthMap] = useState<Record<string, Youth>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadData = () => {
    const allRecords = storageService.getAttendance();
    const allYouth = storageService.getYouth();
    const sortedRecords = allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecords(sortedRecords);
    
    const map: Record<string, Youth> = {};
    allYouth.forEach(y => { map[y.id] = y; });
    setYouthMap(map);

    setFilterDate(prev => {
      if (prev === '' || prev === 'all') {
        return getActiveFriday();
      }
      return prev;
    });
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
    const matchesDate = record.date === filterDate;
    
    return matchesSearch && matchesDate;
  });

  const availableDates = getAllFridaysSinceStart();

  const Indicator = ({ active, icon: Icon, colorClass, label, time }: any) => (
    <div className={`flex flex-col items-center justify-center gap-1 ${active ? '' : 'opacity-40 grayscale-[0.5]'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? colorClass : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{label}</span>
      {time && active && (
        <span className="text-xs font-black text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-md mt-0.5 shadow-sm border border-blue-200 dark:border-blue-800">
          {time}
        </span>
      )}
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
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-8 py-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white outline-none shadow-sm font-black text-lg cursor-pointer"
        >
          {availableDates.map((d: string) => (
            <option key={d} value={d}>{formatDateArabic(d)}</option>
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
                    <td className="px-6 py-4">
                      <div className="flex items-start justify-center gap-3">
                        <Indicator active={record.liturgy} icon={Church} colorClass="bg-amber-100 text-amber-600" label="قداس" time={record.liturgyTime} />
                        <Indicator active={record.communion} icon={Wine} colorClass="bg-rose-100 text-rose-600" label="تناول" />
                        <Indicator active={record.tonia} icon={Shirt} colorClass="bg-indigo-100 text-indigo-600" label="تونية" />
                        <Indicator active={record.meeting} icon={Users} colorClass="bg-emerald-100 text-emerald-600" label="اجتماع" time={record.meetingTime} />
                        <Indicator active={record.visitation} icon={Heart} colorClass="bg-red-100 text-red-600" label="افتقاد" />
                        <Indicator active={record.bibleReading} icon={BookOpen} colorClass="bg-blue-100 text-blue-600" label="إنجيل" />
                        <Indicator active={record.confession} icon={ShieldCheck} colorClass="bg-purple-100 text-purple-600" label="اعتراف" />
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
