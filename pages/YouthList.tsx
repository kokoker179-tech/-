
import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { Youth, AttendanceRecord, Marathon, MarathonGroup } from '../types';
import { 
  X, Search, UserCircle, Edit3, MessageCircle, Check, Copy, Hash, 
  Share2, FileText, Download, Loader2, Trash2, Church, Users, 
  BookOpen, ShieldCheck, Heart, TrendingUp, Filter, SortAsc,
  Award, Trophy
} from 'lucide-react';
import { Link } from "react-router-dom";
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { generateFullReportPDF, generateDetailedYouthReportPDF, formatDateArabic } from '../constants';

interface YouthWithStats extends Youth {
  stats: {
    liturgy: number;
    meeting: number;
    bible: number;
    confession: number;
    visitation: number;
    totalPresent: number;
    totalPossible: number;
    percentage: number;
  }
}

export const YouthList: React.FC = () => {
  const [youth, setYouth] = useState<Youth[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [marathons, setMarathons] = useState<Marathon[]>([]);
  const [groups, setGroups] = useState<MarathonGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'percentage'>('name');

  const loadData = () => {
    setYouth(storageService.getYouth());
    setRecords(storageService.getAttendance());
    setMarathons(storageService.getMarathons());
    setGroups(storageService.getMarathonGroups());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage_updated', loadData);
    return () => window.removeEventListener('storage_updated', loadData);
  }, []);

  const youthWithStats = useMemo(() => {
    return youth.map(y => {
      const yRecords = records.filter(r => r.youthId === y.id);
      const liturgy = yRecords.filter(r => r.liturgy).length;
      const meeting = yRecords.filter(r => r.meeting).length;
      const bible = yRecords.filter(r => r.bibleReading).length;
      const confession = yRecords.filter(r => r.confession).length;
      const visitation = yRecords.filter(r => r.visitation).length;
      
      const weeksSinceAdded = Math.max(1, Math.ceil((Date.now() - y.addedAt) / (1000 * 60 * 60 * 24 * 7)));
      const totalPresent = yRecords.filter(r => r.liturgy || r.meeting).length;
      
      return {
        ...y,
        stats: {
          liturgy,
          meeting,
          bible,
          confession,
          visitation,
          totalPresent,
          totalPossible: weeksSinceAdded,
          percentage: Math.min(100, Math.round((totalPresent / weeksSinceAdded) * 100))
        }
      };
    });
  }, [youth, records]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`⚠️ حذف نهائي!\nهل أنت متأكد من مسح ملف "${name}" تماماً؟`)) {
      setIsDeleting(id);
      await storageService.deleteYouth(id);
      setIsDeleting(null);
    }
  };

  const copyDirectLink = (youthId: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    const link = `${cleanBase}#/youth-profile/${youthId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(youthId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareToWhatsApp = (name: string, youthId: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    const directLink = `${cleanBase}#/youth-profile/${youthId}`;
    const text = encodeURIComponent(`سلام يا ${name}.. ده رابط متابعة حضورك في اجتماع ثانوي بنين:\n\n🔗 ${directLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const generateSinglePDF = async (youth: YouthWithStats) => {
    setIsGenerating(true);
    
    // Calculate full history like in YouthProfile
    const allRecords = records.filter(r => r.youthId === youth.id);
    const joinDateStr = new Date(youth.addedAt).toISOString().split('T')[0];
    const historyMap = new Map<string, any>();

    // 1. Add all actual recorded dates for this youth
    allRecords.forEach(record => {
      if (record.date >= joinDateStr) {
        const deadline = new Date(record.date);
        deadline.setHours(23, 59, 59);
        const isPast = new Date() > deadline;
        const isPresent = record.liturgy || record.meeting || record.visitation || record.bibleReading || record.confession || record.communion || record.tonia;
        
        historyMap.set(record.date, {
          date: record.date,
          formatted: formatDateArabic(record.date),
          status: isPresent ? 'present' : (isPast ? 'absent' : 'pending'),
          record: record
        });
      }
    });

    // 2. Add last 20 Fridays
    let tempDate = new Date();
    const day = tempDate.getDay();
    const diff = tempDate.getDate() - day + (day === 5 ? 0 : (day < 5 ? -2 : 5));
    tempDate.setDate(diff);

    for (let i = 0; i < 20; i++) {
      const dateStr = tempDate.toISOString().split('T')[0];
      if (dateStr >= joinDateStr && !historyMap.has(dateStr)) {
        const deadline = new Date(dateStr);
        deadline.setHours(23, 59, 59);
        const isPast = new Date() > deadline;
        
        historyMap.set(dateStr, {
          date: dateStr,
          formatted: formatDateArabic(dateStr),
          status: isPast ? 'absent' : 'pending',
          record: { liturgy: false, meeting: false, visitation: false, bibleReading: false, confession: false, communion: false, tonia: false }
        });
      } 
      tempDate.setDate(tempDate.getDate() - 7);
    }

    const history = Array.from(historyMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const yPoints = storageService.getMarathonActivityPoints().filter(p => p.youthId === youth.id);
    await generateDetailedYouthReportPDF(youth, history, yPoints);
    setIsGenerating(false);
  };

  const filteredAndSorted = youthWithStats
    .filter(y => y.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'percentage') return b.stats.percentage - a.stats.percentage;
      return a.name.localeCompare(b.name, 'ar');
    });

  return (
    <div className="max-w-7xl mx-auto pb-20 font-['Cairo']">
      {isGenerating && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex flex-col items-center justify-center text-white">
          <Loader2 className="animate-spin mb-4 text-blue-500" size={60} />
          <h3 className="text-2xl font-black">جاري إنشاء التقرير...</h3>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div>
            <h2 className="text-4xl font-black text-slate-800 dark:text-white">دليل الشباب الذكي</h2>
            <p className="text-slate-500 font-bold mt-1">إجمالي المقيدين: {youth.length} شاب</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-80">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" placeholder="ابحث باسم الشاب..."
                    className="w-full pr-12 pl-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white outline-none font-black text-sm shadow-sm focus:border-blue-500 transition-all"
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <select 
              value={sortBy} 
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-6 py-4 rounded-2xl border-2 border-slate-100 bg-white font-black text-sm shadow-sm outline-none cursor-pointer"
            >
              <option value="name">ترتيب بالاسم</option>
              <option value="percentage">ترتيب بالالتزام</option>
            </select>
            <button 
              onClick={() => generateFullReportPDF(filteredAndSorted, records)}
              className="px-6 py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
            >
              <Download size={16} /> تحميل تقرير الكل
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredAndSorted.map(y => {
          const isCopied = copiedId === y.id;
          const deletingThis = isDeleting === y.id;
          
          return (
            <div key={y.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border-2 border-slate-50 dark:border-slate-800 hover:shadow-xl hover:border-blue-100 transition-all group flex flex-col h-full overflow-hidden">
              <div className="p-8 pb-4">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-2xl shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                        {y.name[0]}
                      </div>
                      {(() => {
                        const winnerMarathon = marathons.find(m => !m.active && m.winnerGroupId);
                        if (winnerMarathon) {
                          const winnerGroup = groups.find(g => g.id === winnerMarathon.winnerGroupId);
                          if (winnerGroup?.youthIds.includes(y.id)) {
                            return (
                              <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white animate-bounce" title="بطل الماراثون">
                                <Trophy size={12} />
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-slate-800 dark:text-slate-100 leading-tight mb-1">{y.name}</h4>
                      <div className="flex gap-2">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{y.grade}</span>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full flex items-center gap-1">
                          <Hash size={10} /> {y.code}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link to={`/edit-youth/${y.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                      <Edit3 size={18} />
                    </Link>
                    <button onClick={() => handleDelete(y.id, y.name)} className="p-2 text-rose-400 hover:text-white hover:bg-rose-600 rounded-xl transition-all">
                      {deletingThis ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>

                <div className="mb-6 space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <TrendingUp size={12} className="text-blue-500" /> معدل الالتزام
                    </span>
                    <span className="text-lg font-black text-blue-600">{y.stats.percentage}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${y.stats.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/50 grid grid-cols-5 gap-2 border-y border-slate-50 dark:border-slate-800">
                <MiniStat icon={Church} value={y.stats.liturgy} label="قداس" color="amber" />
                <MiniStat icon={Users} value={y.stats.meeting} label="اجتماع" color="emerald" />
                <MiniStat icon={BookOpen} value={y.stats.bible} label="إنجيل" color="indigo" />
                <MiniStat icon={ShieldCheck} value={y.stats.confession} label="اعتراف" color="purple" />
                <MiniStat icon={Heart} value={y.stats.visitation} label="افتقاد" color="rose" />
              </div>

              <div className="p-6 mt-auto grid grid-cols-2 gap-3">
                <button onClick={() => shareToWhatsApp(y.name, y.id)} className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs transition-all shadow-md active:scale-95">
                  <MessageCircle size={16} /> واتساب
                </button>
                <button onClick={() => copyDirectLink(y.id)} className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-xs transition-all hover:bg-slate-50 active:scale-95">
                  {isCopied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  رابط الملف
                </button>
                <Link to={`/youth-profile/${y.id}`} className="col-span-2 flex items-center justify-center gap-2 py-4 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-2xl font-black text-sm transition-all group/btn">
                  <UserCircle size={20} className="group-hover/btn:scale-110 transition-transform" />
                  عرض السجل الإحصائي الكامل
                </Link>
                <button onClick={() => generateSinglePDF(y)} className="col-span-2 flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs transition-all hover:bg-rose-600 hover:text-white active:scale-95">
                  <Download size={16} /> تحميل تقرير PDF
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MiniStat = ({ icon: Icon, value, label, color }: any) => {
  const colors: any = {
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
    indigo: 'text-indigo-600',
    purple: 'text-purple-600',
    rose: 'text-rose-600'
  };
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-700 ${colors[color]}`}>
        <Icon size={16} />
      </div>
      <span className="text-sm font-black text-slate-800 dark:text-slate-200">{value}</span>
      <span className="text-[8px] font-black text-slate-400 uppercase">{label}</span>
    </div>
  );
};
