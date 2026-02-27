import React, { useState, useEffect } from 'react';
import { 
  Search, Loader2, ChevronDown, ChevronUp, Church, Users, Heart, 
  BookOpen, ShieldCheck, Clock, Calendar, X, RefreshCw, CheckCircle2, UserCheck,
  Music, Trophy, Wine, Scroll, Brain, UtensilsCrossed, LogOut, Lock, Plus, Edit3, Trash2, Save, Filter, User, UserCircle, XCircle, Check, Shirt
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { Youth, AttendanceRecord, Servant, Marathon, MarathonGroup, MarathonPointSystem } from '../types';
import { getActiveFriday, formatDateArabic } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { Link } from 'react-router-dom';

const DateInput = ({ value, onChange }: { value: string | undefined, onChange: (val: string) => void }) => {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');

  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setMonth(parts[1]);
        setDay(parts[2]);
      }
    } else {
      setDay('');
      setMonth('');
    }
  }, [value]);

  const handleDateChange = (d: string, m: string) => {
    const dayNum = parseInt(d);
    const monthNum = parseInt(m);
    if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12) {
      const formattedDate = `2026-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      onChange(formattedDate);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-slate-100 bg-white focus-within:border-purple-400">
      <input 
        type="number" 
        placeholder="يوم" 
        value={day}
        onChange={(e) => { setDay(e.target.value); handleDateChange(e.target.value, month); }}
        className="w-1/3 font-bold outline-none bg-transparent text-center"
      />
      <span className="text-slate-300">/</span>
      <input 
        type="number" 
        placeholder="شهر" 
        value={month}
        onChange={(e) => { setMonth(e.target.value); handleDateChange(day, e.target.value); }}
        className="w-1/3 font-bold outline-none bg-transparent text-center"
      />
      <span className="font-black text-slate-400 text-sm">/ 2026</span>
    </div>
  );
};

export const RegisterAttendance: React.FC = () => {
  const [youth, setYouth] = useState<Youth[]>([]);
  const [servants, setServants] = useState<Servant[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [marathons, setMarathons] = useState<Marathon[]>([]);
  const [activeMarathon, setActiveMarathon] = useState<Marathon | null>(null);
  const [marathonGroups, setMarathonGroups] = useState<MarathonGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(getActiveFriday());
  const [isAutoDate, setIsAutoDate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const loadData = () => {
    setYouth(storageService.getYouth());
    setServants(storageService.getServants());
    const allRecords = storageService.getAttendance();
    setRecords(allRecords.filter(r => r.date === selectedDate));
    
    const allMarathons = storageService.getMarathons();
    setMarathons(allMarathons);
    const active = allMarathons.find(m => m.active);
    setActiveMarathon(active || null);
    setMarathonGroups(storageService.getMarathonGroups());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage_updated', loadData);
    return () => window.removeEventListener('storage_updated', loadData);
  }, [selectedDate]);

  const updateRecordField = async (personId: string, field: keyof AttendanceRecord, value: any, isServant: boolean) => {
    const existingRecord = records.find(r => isServant ? r.servantId === personId : r.youthId === personId);
    let newRecord: AttendanceRecord;

    if (existingRecord) {
      newRecord = { ...existingRecord, [field]: value };
      if (field === 'confession' && value === true) {
        newRecord.confessionDate = selectedDate;
      }
    } else {
      newRecord = {
        id: `${personId}-${selectedDate}`,
        youthId: isServant ? undefined : personId,
        servantId: isServant ? personId : undefined,
        date: selectedDate,
        liturgy: field === 'liturgy' ? value : false,
        meeting: field === 'meeting' ? value : false,
        visitation: field === 'visitation' ? value : false,
        bibleReading: field === 'bibleReading' ? value : false,
        confession: field === 'confession' ? value : false,
        communion: field === 'communion' ? value : false,
        [field]: value
      };
      if (field === 'confession' && value === true) newRecord.confessionDate = selectedDate;
    }

    if ((field === 'liturgy' || field === 'communion') && value === false) {
      newRecord.tonia = false;
    }

    const allRecords = storageService.getAttendance();
    const idx = allRecords.findIndex(r => (isServant ? r.servantId === personId : r.youthId === personId) && r.date === selectedDate);
    
    if (idx > -1) allRecords[idx] = newRecord;
    else allRecords.push(newRecord);

    // Auto-update Marathon Points if applicable
    if (!isServant && activeMarathon && activeMarathon.startDate <= selectedDate && activeMarathon.endDate >= selectedDate) {
      const userGroups = marathonGroups.filter(g => activeMarathon.groupIds.includes(g.id));
      const isInMarathon = userGroups.some(g => g.youthIds.includes(personId));
      
      if (isInMarathon) {
        const pointSystem = activeMarathon.pointSystem;
        
        const updatePoint = (activity: keyof typeof pointSystem, reason: string) => {
          const points = storageService.getMarathonActivityPoints();
          const filteredPoints = points.filter(p => 
            !(p.marathonId === activeMarathon.id && 
              p.youthId === personId && 
              p.weekDate === selectedDate && 
              p.activity === activity)
          );
          
          if (value === true) {
            filteredPoints.push({
              marathonId: activeMarathon.id,
              youthId: personId,
              weekDate: selectedDate,
              activity: activity as keyof MarathonPointSystem,
              points: pointSystem[activity],
              reason,
              timestamp: Date.now()
            });
          }
          storageService.saveMarathonActivityPoints(filteredPoints);
        };

        if (field === 'liturgy') updatePoint('liturgy', 'حضور القداس الإلهي');
        if (field === 'meeting') updatePoint('meeting', 'حضور الاجتماع الأسبوعي');
        if (field === 'confession') updatePoint('confession', 'ممارسة سر الاعتراف');
        if (field === 'tasbeha') updatePoint('tasbeha', 'حضور التسبحة');
        if (field === 'communion') updatePoint('communion', 'التناول من الأسرار المقدسة');
        if (field === 'fasting') updatePoint('fasting', 'الالتزام بالصوم');
        if (field === 'memorizationPart') updatePoint('memorizationPart', 'تسميع جزء الحفظ');
        if (field === 'exodusCompetition') updatePoint('exodusCompetition', 'مسابقة سفر الخروج');
        if (field === 'weeklyCompetition') updatePoint('weeklyCompetition', 'الفوز في مسابقة الجمعة');
      }
    }

    setLoading(true);
    await storageService.saveAttendance(allRecords);
    setLoading(false);
  };

  const filteredYouth = youth.filter(y => y.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const renderPersonList = (people: (Youth | Servant)[], isServant: boolean) => {
    return people.map(person => {
      const record = records.find(r => isServant ? r.servantId === person.id : r.youthId === person.id);
      const isExpanded = expandedId === person.id;
      const isRegistered = !!record;
      
      // Check if youth is in active marathon
      let isInMarathon = false;
      if (!isServant && activeMarathon) {
        const userGroups = marathonGroups.filter(g => activeMarathon.groupIds.includes(g.id));
        isInMarathon = userGroups.some(g => g.youthIds.includes(person.id));
      }

      return (
        <div key={person.id} className={`bg-white rounded-[2.5rem] shadow-sm border-2 transition-all overflow-hidden ${isExpanded ? 'border-blue-600 ring-8 ring-blue-50' : (isRegistered ? 'border-emerald-100 shadow-emerald-50' : 'border-slate-50')}`}>
          <div className="p-6 md:p-8 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : person.id)}>
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all ${isRegistered ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                {isRegistered ? <CheckCircle2 size={24} /> : person.name[0]}
              </div>
              <div>
                <h4 className="font-black text-xl text-slate-800 flex items-center gap-2">
                  {person.name}
                  {isInMarathon && <Trophy size={16} className="text-amber-500" />}
                </h4>
                <div className="flex gap-2">
                   <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                     {isServant ? (person as Servant).role : (person as Youth).grade}
                   </span>
                   {record?.liturgyTime && !isServant && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">حضر: {record.liturgyTime}</span>}
                </div>
              </div>
            </div>
            {isExpanded ? <ChevronUp className="text-slate-300" /> : <ChevronDown className="text-slate-300" />}
          </div>
          
          {isExpanded && (
            <div className="p-8 bg-slate-50/50 border-t-2 border-slate-50 space-y-8 animate-in slide-in-from-top-4">
              {/* Status Grid */}
              <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                <StatusToggle active={record?.liturgy} icon={Church} label="قداس" color="amber" onClick={() => updateRecordField(person.id, 'liturgy', !record?.liturgy, isServant)} />
                <StatusToggle 
                  active={record?.communion} 
                  icon={Wine} 
                  label="تناول" 
                  color="rose" 
                  disabled={!record?.liturgy}
                  onClick={() => {
                    if (record?.liturgy) {
                      updateRecordField(person.id, 'communion', !record?.communion, isServant);
                    }
                  }} 
                />
                <StatusToggle 
                  active={record?.tonia} 
                  icon={Shirt} 
                  label="تونية" 
                  color="indigo" 
                  disabled={!record?.liturgy || !record?.communion}
                  onClick={() => {
                    if (record?.liturgy && record?.communion) {
                      updateRecordField(person.id, 'tonia', !record?.tonia, isServant);
                    }
                  }} 
                />
                <StatusToggle active={record?.meeting} icon={Users} label="اجتماع" color="emerald" onClick={() => updateRecordField(person.id, 'meeting', !record?.meeting, isServant)} />
                {!isServant && (
                  <>
                    <StatusToggle active={record?.bibleReading} icon={BookOpen} label="قرأ الإنجيل" color="blue" onClick={() => updateRecordField(person.id, 'bibleReading', !record?.bibleReading, isServant)} />
                    <StatusToggle active={record?.confession} icon={ShieldCheck} label="اعترف" color="purple" onClick={() => updateRecordField(person.id, 'confession', !record?.confession, isServant)} />
                    <StatusToggle active={record?.visitation} icon={Heart} label="افتقاد" color="rose" onClick={() => updateRecordField(person.id, 'visitation', !record?.visitation, isServant)} />
                  </>
                )}
              </div>

              {isInMarathon && !isServant && (
                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                  <h5 className="font-black text-amber-800 mb-4 flex items-center gap-2"><Trophy size={18}/> نقاط الماراثون الإضافية</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatusToggle active={record?.tasbeha} icon={Music} label="تسبحة" color="indigo" onClick={() => updateRecordField(person.id, 'tasbeha', !record?.tasbeha, isServant)} />
                    <StatusToggle active={record?.fasting} icon={UtensilsCrossed} label="صوم" color="emerald" onClick={() => updateRecordField(person.id, 'fasting', !record?.fasting, isServant)} />
                    <StatusToggle active={record?.memorizationPart} icon={Brain} label="حفظ" color="blue" onClick={() => updateRecordField(person.id, 'memorizationPart', !record?.memorizationPart, isServant)} />
                    <StatusToggle active={record?.exodusCompetition} icon={Scroll} label="مسابقة سفر الخروج" color="amber" onClick={() => updateRecordField(person.id, 'exodusCompetition', !record?.exodusCompetition, isServant)} />
                    <StatusToggle active={record?.weeklyCompetition} icon={Trophy} label="مسابقة الجمعة" color="purple" onClick={() => updateRecordField(person.id, 'weeklyCompetition', !record?.weeklyCompetition, isServant)} />
                  </div>
                </div>
              )}

              {/* Time & Date Details */}
              {!isServant && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-200">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} className="text-amber-500" /> وقت القداس (ساعة : دقيقة)
                    </label>
                    <input 
                      type="time" value={record?.liturgyTime || ''} 
                      onChange={(e) => updateRecordField(person.id, 'liturgyTime', e.target.value, isServant)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} className="text-emerald-500" /> وقت الاجتماع (ساعة : دقيقة)
                    </label>
                    <input 
                      type="time" value={record?.meetingTime || ''} 
                      onChange={(e) => updateRecordField(person.id, 'meetingTime', e.target.value, isServant)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck size={14} className="text-purple-500" /> اعترف مع مين؟
                    </label>
                    <input 
                      type="text" 
                      placeholder="اسم أبونا..."
                      value={record?.confessorName || ''} 
                      onChange={(e) => updateRecordField(person.id, 'confessorName', e.target.value, isServant)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-purple-400"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={14} className="text-purple-500" /> تاريخ الاعتراف الفعلي
                    </label>
                    <DateInput 
                      value={record?.confessionDate}
                      onChange={(val) => updateRecordField(person.id, 'confessionDate', val, isServant)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <UserCheck size={14} className="text-rose-500" /> مين افتقده؟
                    </label>
                    <input 
                      type="text" 
                      placeholder="اسم الخادم..."
                      value={record?.visitationDetails?.visitorName || ''} 
                      onChange={(e) => updateRecordField(person.id, 'visitationDetails', { ...record?.visitationDetails, visitorName: e.target.value }, isServant)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 font-bold outline-none focus:border-rose-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={14} className="text-rose-500" /> تاريخ الافتقاد
                    </label>
                    <DateInput 
                      value={record?.visitationDetails?.visitDate}
                      onChange={(val) => updateRecordField(person.id, 'visitationDetails', { ...record?.visitationDetails, visitDate: val }, isServant)}
                    />
                  </div>
                </div>
              )}

              {isRegistered && (
                <div className="pt-6 border-t border-slate-200 flex justify-end">
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm(`هل أنت متأكد من حذف تسجيل حضور ${person.name} لهذا اليوم؟`)) {
                        setLoading(true);
                        await storageService.deleteAttendanceRecord(record.id);
                        setLoading(false);
                        setExpandedId(null);
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-600 hover:text-white transition-all"
                  >
                    <LogOut size={18} /> تسجيل خروج (حذف الحضور)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      );
    });
  };

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
        <input 
          type="text" 
          placeholder="ابحث بالاسم هنا..." 
          className="w-full pl-6 pr-16 py-6 rounded-[2.5rem] border-2 border-slate-100 bg-white outline-none text-xl font-black focus:border-blue-500 transition-all shadow-sm" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      <div className="space-y-4">
        {renderPersonList(filteredYouth, false)}
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

const StatusToggle = ({ active, icon: Icon, label, color, onClick, disabled }: any) => {
  const themes: any = {
    amber: active ? 'bg-amber-600 border-amber-500 text-white shadow-amber-100' : 'bg-white border-slate-100 text-slate-300',
    emerald: active ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-100' : 'bg-white border-slate-100 text-slate-300',
    blue: active ? 'bg-blue-600 border-blue-500 text-white shadow-blue-100' : 'bg-white border-slate-100 text-slate-300',
    indigo: active ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-100' : 'bg-white border-slate-100 text-slate-300',
    purple: active ? 'bg-purple-600 border-purple-500 text-white shadow-purple-100' : 'bg-white border-slate-100 text-slate-300',
    rose: active ? 'bg-rose-600 border-rose-500 text-white shadow-rose-100' : 'bg-white border-slate-100 text-slate-300',
  };
  return (
    <button 
      disabled={disabled}
      onClick={onClick} 
      className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all gap-2 aspect-square hover:scale-105 active:scale-95 ${themes[color]} ${disabled ? 'opacity-20 grayscale cursor-not-allowed' : ''}`}
    >
      <Icon size={24} />
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
};
