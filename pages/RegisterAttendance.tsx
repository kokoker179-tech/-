import React, { useState, useEffect } from 'react';
import { 
  Search, Loader2, ChevronDown, ChevronUp, Church, Users, Heart, 
  BookOpen, ShieldCheck, Clock, Calendar, X, RefreshCw, CheckCircle2
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Youth, AttendanceRecord } from '../types';
import { getActiveFriday, formatDateArabic } from '../constants';

export const RegisterAttendance: React.FC = () => {
  const [youth, setYouth] = useState<Youth[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(getActiveFriday());
  const [isAutoDate, setIsAutoDate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const loadData = () => {
    setYouth(storageService.getYouth());
    const allRecords = storageService.getAttendance();
    setRecords(allRecords.filter(r => r.date === selectedDate));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage_updated', loadData);
    return () => window.removeEventListener('storage_updated', loadData);
  }, [selectedDate]);

  const updateRecordField = async (youthId: string, field: keyof AttendanceRecord, value: any) => {
    const existingRecord = records.find(r => r.youthId === youthId);
    let newRecord: AttendanceRecord;

    if (existingRecord) {
      newRecord = { ...existingRecord, [field]: value };
      // إذا تم تفعيل الاعتراف اليوم، سجل تاريخ اليوم تلقائياً
      if (field === 'confession' && value === true) {
        newRecord.confessionDate = selectedDate;
      }
    } else {
      newRecord = {
        id: `${youthId}-${selectedDate}`,
        youthId,
        date: selectedDate,
        liturgy: field === 'liturgy' ? value : false,
        meeting: field === 'meeting' ? value : false,
        visitation: field === 'visitation' ? value : false,
        bibleReading: field === 'bibleReading' ? value : false,
        confession: field === 'confession' ? value : false,
        [field]: value
      };
      if (field === 'confession' && value === true) newRecord.confessionDate = selectedDate;
    }

    const allRecords = storageService.getAttendance();
    const idx = allRecords.findIndex(r => r.youthId === youthId && r.date === selectedDate);
    
    if (idx > -1) allRecords[idx] = newRecord;
    else allRecords.push(newRecord);

    setLoading(true);
    await storageService.saveAttendance(allRecords);
    setLoading(false);
  };

  const filteredYouth = youth.filter(y => y.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto pb-24 font-['Cairo']">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-blue-100">
            <Calendar size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white">كشف حضور الجمعة</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-md uppercase tracking-wider">تلقائي</span>
              <p className="text-blue-600 font-black text-lg">
                {formatDateArabic(selectedDate)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button 
              onClick={() => { setSelectedDate(getActiveFriday()); setIsAutoDate(true); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${isAutoDate ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              الأسبوع الحالي
            </button>
            <button 
              onClick={() => setIsAutoDate(false)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${!isAutoDate ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              تاريخ آخر
            </button>
          </div>
          {!isAutoDate && (
            <input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
              className="px-4 py-2 rounded-xl border-2 border-blue-50 bg-white font-black text-sm outline-none focus:border-blue-500 transition-all" 
            />
          )}
        </div>
      </div>

      <div className="relative mb-8">
        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
        <input type="text" placeholder="ابحث باسم الشاب هنا..." className="w-full pl-6 pr-16 py-6 rounded-[2.5rem] border-2 border-slate-100 bg-white outline-none text-xl font-black focus:border-blue-500 transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="space-y-4">
        {filteredYouth.map(y => {
          const record = records.find(r => r.youthId === y.id);
          const isExpanded = expandedId === y.id;
          const isRegistered = !!record;

          return (
            <div key={y.id} className={`bg-white rounded-[2.5rem] shadow-sm border-2 transition-all overflow-hidden ${isExpanded ? 'border-blue-600 ring-8 ring-blue-50' : (isRegistered ? 'border-emerald-100 shadow-emerald-50' : 'border-slate-50')}`}>
              <div className="p-6 md:p-8 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : y.id)}>
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all ${isRegistered ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                    {isRegistered ? <CheckCircle2 size={24} /> : y.name[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-slate-800">{y.name}</h4>
                    <div className="flex gap-2">
                       <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{y.grade}</span>
                       {record?.liturgyTime && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">حضر: {record.liturgyTime}</span>}
                    </div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="text-slate-300" /> : <ChevronDown className="text-slate-300" />}
              </div>
              
              {isExpanded && (
                <div className="p-8 bg-slate-50/50 border-t-2 border-slate-50 space-y-8 animate-in slide-in-from-top-4">
                  {/* Status Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatusToggle active={record?.liturgy} icon={Church} label="قداس" color="amber" onClick={() => updateRecordField(y.id, 'liturgy', !record?.liturgy)} />
                    <StatusToggle active={record?.meeting} icon={Users} label="اجتماع" color="emerald" onClick={() => updateRecordField(y.id, 'meeting', !record?.meeting)} />
                    <StatusToggle active={record?.bibleReading} icon={BookOpen} label="قرأ الإنجيل" color="blue" onClick={() => updateRecordField(y.id, 'bibleReading', !record?.bibleReading)} />
                    <StatusToggle active={record?.confession} icon={ShieldCheck} label="اعترف" color="purple" onClick={() => updateRecordField(y.id, 'confession', !record?.confession)} />
                    <StatusToggle active={record?.visitation} icon={Heart} label="افتقاد" color="rose" onClick={() => updateRecordField(y.id, 'visitation', !record?.visitation)} />
                  </div>

                  {/* Time & Date Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-200">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={14} className="text-amber-500" /> وقت القداس
                      </label>
                      <input 
                        type="time" value={record?.liturgyTime || ''} 
                        onChange={(e) => updateRecordField(y.id, 'liturgyTime', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Clock size={14} className="text-emerald-500" /> وقت الاجتماع
                      </label>
                      <input 
                        type="time" value={record?.meetingTime || ''} 
                        onChange={(e) => updateRecordField(y.id, 'meetingTime', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={14} className="text-purple-500" /> ميعاد الاعتراف
                      </label>
                      <input 
                        type="date" value={record?.confessionDate || ''} 
                        onChange={(e) => updateRecordField(y.id, 'confessionDate', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="fixed bottom-10 left-10 bg-slate-900 text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4">
          <RefreshCw className="animate-spin text-blue-400" size={20} />
          <span className="font-black text-sm uppercase">جاري حفظ البيانات سحابياً...</span>
        </div>
      )}
    </div>
  );
};

const StatusToggle = ({ active, icon: Icon, label, color, onClick }: any) => {
  const themes: any = {
    amber: active ? 'bg-amber-600 border-amber-500 text-white shadow-amber-100' : 'bg-white border-slate-100 text-slate-300',
    emerald: active ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-100' : 'bg-white border-slate-100 text-slate-300',
    blue: active ? 'bg-blue-600 border-blue-500 text-white shadow-blue-100' : 'bg-white border-slate-100 text-slate-300',
    purple: active ? 'bg-purple-600 border-purple-500 text-white shadow-purple-100' : 'bg-white border-slate-100 text-slate-300',
    rose: active ? 'bg-rose-600 border-rose-500 text-white shadow-rose-100' : 'bg-white border-slate-100 text-slate-300',
  };
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all gap-2 aspect-square hover:scale-105 active:scale-95 ${themes[color]}`}>
      <Icon size={24} />
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
};
