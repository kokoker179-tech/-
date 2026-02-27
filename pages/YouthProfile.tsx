
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from "react-router-dom";
import { storageService } from '../services/storageService';
import { Youth, AttendanceRecord, Marathon, MarathonGroup } from '../types';
import { 
  ArrowRight, Church, Users, BookOpen, ShieldCheck, 
  Calendar, Share2, Award, LogOut, Hash, Check, Phone, 
  TrendingUp, Star, Trophy, Target, FileDown, Loader2, X, Wine, Clock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell
} from 'recharts';
import { isPastDeadline, formatDateArabic, getActiveFriday, generateDetailedYouthReportPDF, SYSTEM_START_DATE, getAllFridaysSinceStart } from '../constants';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface YouthProfileProps {
  onLogout?: () => void;
}

export const YouthProfile: React.FC<YouthProfileProps> = ({ onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [youth, setYouth] = useState<Youth | null>(null);
  const [weeklyHistory, setWeeklyHistory] = useState<any[]>([]);
  const [marathons, setMarathons] = useState<Marathon[]>([]);
  const [groups, setGroups] = useState<MarathonGroup[]>([]);
  const [marathonPoints, setMarathonPoints] = useState<any[]>([]);
  const [summary, setSummary] = useState({ 
    present: 0, absent: 0, totalFridays: 0, 
    liturgy: 0, meeting: 0, bible: 0, confession: 0, visitation: 0, communion: 0 
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = () => {
    const adminStatus = storageService.isLoggedIn();
    setIsAdmin(adminStatus);
    const allYouth = storageService.getYouth();
    const found = allYouth.find(y => y.id === id);
    if (found) {
      setYouth(found);
      
      const allRecords = storageService.getAttendance().filter(r => r.youthId === found.id);
      const joinDateStr = found.addedAt ? new Date(found.addedAt).toISOString().split('T')[0] : '2020-01-01';
      const effectiveJoinDate = joinDateStr < SYSTEM_START_DATE ? SYSTEM_START_DATE : joinDateStr;
      const historyMap = new Map<string, any>();

      // 1. Add all actual recorded dates for this youth
      allRecords.forEach(record => {
        if (record.date >= SYSTEM_START_DATE) {
          const isPresent = record.liturgy || record.meeting || record.visitation || record.bibleReading || record.confession || record.communion || record.tonia;
          historyMap.set(record.date, {
            date: record.date,
            formatted: formatDateArabic(record.date),
            status: isPresent ? 'present' : (isPastDeadline(record.date) ? 'absent' : 'pending'),
            record: record
          });
        }
      });

      // 2. Add all Fridays since start to ensure we show absences for regular meeting days
      const allFridays = getAllFridaysSinceStart();
      allFridays.forEach(dateStr => {
        if (dateStr >= effectiveJoinDate && !historyMap.has(dateStr)) {
          const isPast = isPastDeadline(dateStr);
          historyMap.set(dateStr, {
            date: dateStr,
            formatted: formatDateArabic(dateStr),
            status: isPast ? 'absent' : 'pending',
            record: { liturgy: false, meeting: false, visitation: false, bibleReading: false, confession: false, communion: false, tonia: false }
          });
        }
      });

      // 3. Convert to array and sort descending by date
      const history = Array.from(historyMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setWeeklyHistory(history);
      setSummary({
        present: history.filter(h => h.status === 'present').length,
        absent: history.filter(h => h.status === 'absent').length,
        totalFridays: history.length,
        liturgy: allRecords.filter(r => r.liturgy).length,
        meeting: allRecords.filter(r => r.meeting).length,
        bible: allRecords.filter(r => r.bibleReading).length,
        confession: allRecords.filter(r => r.confession).length,
        visitation: allRecords.filter(r => r.visitation).length,
        communion: allRecords.filter(r => r.communion).length
      });

      setMarathons(storageService.getMarathons());
      setGroups(storageService.getMarathonGroups());
      setMarathonPoints(storageService.getMarathonActivityPoints().filter(p => p.youthId === found.id));
    } else {
      if (id !== 'portal') navigate('/');
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage_updated', loadData);
    return () => window.removeEventListener('storage_updated', loadData);
  }, [id, navigate]);

  const downloadPDFReport = async () => {
    if (!youth) return;
    setIsGenerating(true);
    await generateDetailedYouthReportPDF(youth, weeklyHistory, marathonPoints);
    setIsGenerating(false);
  };

  const handleFullLogout = () => { 
    if (onLogout) onLogout(); 
    else storageService.logout(); 
    navigate('/register-attendance'); 
  };
  const shareMyProfile = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    const link = `${cleanBase}#/youth-profile/${youth?.id}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  if (!youth) return null;
  const calculateAttendanceRate = () => {
    if (weeklyHistory.length === 0) return 0;
    
    const calcPointsForHistory = (hList: typeof weeklyHistory) => {
      let pts = 0;
      hList.forEach(h => {
        const r = h.record;
        if (r) {
          pts += (r.liturgy ? 1 : 0) + (r.meeting ? 1 : 0) + (r.communion ? 0.5 : 0) + (r.confession ? 0.5 : 0) + (r.bibleReading ? 0.5 : 0);
        }
      });
      return pts;
    };

    const recentHistory = weeklyHistory.slice(0, 4);
    const historicalHistory = weeklyHistory.slice(4);
    
    const recentPoints = calcPointsForHistory(recentHistory);
    const historicalPoints = calcPointsForHistory(historicalHistory);
    
    const recentMax = recentHistory.length * 2;
    const historicalMax = historicalHistory.length * 2;
    
    let percentage = 0;
    if (weeklyHistory.length <= 4) {
      percentage = recentMax > 0 ? Math.round((recentPoints / recentMax) * 100) : 0;
    } else {
      const recentRate = recentMax > 0 ? (recentPoints / recentMax) : 0;
      const historicalRate = historicalMax > 0 ? (historicalPoints / historicalMax) : 0;
      // 60% weight for recent, 40% for historical
      percentage = Math.round((recentRate * 0.6 + historicalRate * 0.4) * 100);
    }
    
    return Math.min(100, percentage);
  };
  
  const attendanceRate = calculateAttendanceRate();
  
  return (
    <div className="max-w-6xl mx-auto pb-20 font-['Cairo'] relative">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {isAdmin ? (
            <div className="flex gap-2">
              <Link to="/youth-list" className="flex items-center gap-2 text-slate-600 font-black bg-white border px-6 py-3 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                <ArrowRight size={20} /> العودة
              </Link>
            </div>
          ) : (
            <button onClick={handleFullLogout} className="flex items-center gap-2 bg-white text-rose-500 border border-rose-100 px-6 py-3 rounded-2xl font-black shadow-sm transition-all">
              <LogOut size={20} /> خروج
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button onClick={downloadPDFReport} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl hover:bg-emerald-700">
            <FileDown size={20} /> تحميل تقرير PDF
          </button>
          <button onClick={shareMyProfile} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black shadow-xl transition-all ${linkCopied ? 'bg-blue-800 text-white' : 'bg-blue-600 text-white'}`}>
            {linkCopied ? 'تم النسخ' : 'مشاركة ملفي'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-12 shadow-lg border border-slate-100 dark:border-slate-800 mb-8 relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative shrink-0">
            {youth.image ? (
              <img src={youth.image} alt={youth.name} className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover shadow-2xl border-8 border-white dark:border-slate-800" />
            ) : (
              <div className="w-40 h-40 md:w-48 md:h-48 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-full flex items-center justify-center text-white text-6xl font-black shadow-2xl border-8 border-white dark:border-slate-800">{youth.name[0]}</div>
            )}
            {(() => {
              const winnerMarathon = marathons.find(m => !m.active && m.winnerGroupId);
              if (winnerMarathon) {
                const winnerGroup = groups.find(g => g.id === winnerMarathon.winnerGroupId);
                if (winnerGroup?.youthIds.includes(youth.id)) {
                  return (
                    <div className="absolute -top-4 -right-4 bg-amber-500 text-white p-3 rounded-full shadow-2xl border-4 border-white animate-bounce" title="بطل الماراثون">
                      <Trophy size={24} />
                    </div>
                  );
                }
              }
              return null;
            })()}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full shadow-xl border-2 border-white dark:border-slate-800 font-black text-sm bg-amber-400 text-amber-900">
              التزام {attendanceRate}%
            </div>
          </div>
          <div className="text-center md:text-right flex-1">
            <p className="text-blue-600 font-bold mb-2">ملف التميز الشخصي</p>
            <h2 className="text-5xl md:text-6xl font-black text-slate-800 dark:text-white mb-4 leading-tight">{youth.name}</h2>
            <div className="flex flex-wrap gap-3 mb-6 justify-center md:justify-start">
              <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-5 py-2 rounded-full text-sm font-black border border-blue-200 dark:border-blue-800 flex items-center gap-2">
                <Target size={16} /> {youth.grade}
              </span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-5 py-2 rounded-full text-sm font-black border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <Hash size={16} /> الكود: {youth.code}
              </span>
              {youth.region && (
                <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-5 py-2 rounded-full text-sm font-black border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                  <Target size={16} /> المنطقة: {youth.region}
                </span>
              )}
              {youth.phone && (
                <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-5 py-2 rounded-full text-sm font-black border border-indigo-200 dark:border-indigo-800 flex items-center gap-2">
                  <Phone size={16} /> الهاتف: {youth.phone}
                </span>
              )}
              {marathonPoints.length > 0 && (
                <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-5 py-2 rounded-full text-sm font-black border border-amber-200 dark:border-amber-800 flex items-center gap-2">
                  <Star size={16} /> نقاط الماراثون: {marathonPoints.reduce((sum, p) => sum + p.points, 0)}
                </span>
              )}
            </div>
            <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1 border border-slate-200 dark:border-slate-700">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000" style={{ width: `${attendanceRate}%` }}></div>
            </div>
            {attendanceRate >= 90 && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl border border-amber-200 animate-bounce">
                <Trophy size={16} />
                <span className="text-xs font-black">أنت بطل! التزامك رائع جداً</span>
              </div>
            )}
            {isAdmin && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-right">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase">رقم الأب</p>
                  <p className="font-bold text-slate-700 dark:text-slate-200">{youth.fatherPhone || '—'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase">رقم الأم</p>
                  <p className="font-bold text-slate-700 dark:text-slate-200">{youth.motherPhone || '—'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-black text-slate-400 uppercase">عدد الإخوة</p>
                  <p className="font-bold text-slate-700 dark:text-slate-200">{youth.siblingsCount || 0}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <StatCard icon={Church} label="القداسات" value={summary.liturgy} color="amber" />
        <StatCard icon={Wine} label="التناول" value={summary.communion} color="rose" />
        <StatCard icon={Users} label="الاجتماعات" value={summary.meeting} color="emerald" />
        <StatCard icon={BookOpen} label="قراءات إنجيل" value={summary.bible} color="blue" />
        <StatCard icon={ShieldCheck} label="سر الاعتراف" value={summary.confession} color="purple" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden mb-10">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <Calendar className="text-blue-600" /> سجل الحضور التفصيلي
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest border-b-2 border-slate-200 dark:border-slate-700">
                <th className="px-8 py-5">التاريخ / اليوم</th>
                <th className="px-8 py-5 text-center">الحالة</th>
                <th className="px-8 py-5 text-center">قداس / وقت</th>
                <th className="px-8 py-5 text-center">تناول</th>
                <th className="px-8 py-5 text-center">تونية</th>
                <th className="px-8 py-5 text-center">اجتماع / وقت</th>
                <th className="px-8 py-5 text-center">إنجيل</th>
                <th className="px-8 py-5 text-center">اعتراف</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-800">
              {weeklyHistory.map((h, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-800 dark:text-slate-100 text-base">{h.formatted}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${ 
                      h.status === 'present' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 
                      h.status === 'absent' ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800' : 
                      'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {h.status === 'present' ? 'حضور' : h.status === 'absent' ? 'غياب' : 'قادم'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {h.record.liturgy ? (
                        <>
                          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-4 py-1.5 rounded-lg shadow-sm">حضر</span>
                          {h.record.liturgyTime && <span className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-md border border-slate-100" dir="ltr">⏰ {h.record.liturgyTime}</span>}
                        </>
                      ) : <span className="text-xs font-black text-rose-800 bg-rose-100 px-4 py-1.5 rounded-lg shadow-sm">غائب</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    {h.record.communion ? 
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-4 py-1.5 rounded-lg shadow-sm">تناول</span> : 
                      <span className="text-xs font-black text-slate-500 bg-slate-100 px-4 py-1.5 rounded-lg">لا</span>}
                  </td>
                  <td className="px-8 py-6 text-center">
                    {h.record.tonia ? 
                      <span className="text-xs font-black text-indigo-800 bg-indigo-100 px-4 py-1.5 rounded-lg shadow-sm">تونية</span> : 
                      <span className="text-xs font-black text-slate-500 bg-slate-100 px-4 py-1.5 rounded-lg">لا</span>}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {h.record.meeting ? (
                        <>
                          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-4 py-1.5 rounded-lg shadow-sm">حضر</span>
                          {h.record.meetingTime && <span className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-md border border-slate-100" dir="ltr">⏰ {h.record.meetingTime}</span>}
                        </>
                      ) : <span className="text-xs font-black text-rose-800 bg-rose-100 px-4 py-1.5 rounded-lg shadow-sm">غائب</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    {h.record.bibleReading ? 
                      <span className="text-xs font-black text-blue-800 bg-blue-100 px-4 py-1.5 rounded-lg shadow-sm">قرأ</span> : 
                      <span className="text-xs font-black text-slate-500 bg-slate-100 px-4 py-1.5 rounded-lg">لا</span>}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {h.record.confession ? (
                        <>
                          <span className="text-xs font-black text-purple-800 bg-purple-100 px-4 py-1.5 rounded-lg shadow-sm">اعترف</span>
                          {h.record.confessionDate && <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">{h.record.confessionDate.split('-').slice(1).join('/')}</span>}
                        </>
                      ) : <span className="text-xs font-black text-slate-500 bg-slate-100 px-4 py-1.5 rounded-lg">لا</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[3rem] p-12 text-white text-center relative overflow-hidden shadow-2xl mb-10">
        <div className="relative z-10 space-y-4">
          <Trophy size={52} className="mx-auto text-amber-400 drop-shadow-lg animate-bounce" />
          <h3 className="text-3xl font-black">عاش يا بطل!</h3>
          <p className="text-blue-100 font-bold max-w-md mx-auto text-lg">
            مستوى التزامك بنسبة <span className="text-amber-300">{attendanceRate}%</span> هو دليل على محبتك لربنا وللكنيسة.
          </p>
        </div>
      </div>

      {marathonPoints.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-900/10">
            <h3 className="text-xl font-black text-amber-800 dark:text-amber-300 flex items-center gap-3">
              <Star className="text-amber-500" /> سجل نقاط الماراثون
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-4">التاريخ</th>
                  <th className="px-8 py-4">النشاط</th>
                  <th className="px-8 py-4 text-center">النقاط</th>
                  <th className="px-8 py-4">السبب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {marathonPoints.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-black text-slate-700 dark:text-slate-200 text-sm">{formatDateArabic(p.weekDate)}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black">{p.activity}</span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <p className="font-black text-emerald-600">+{p.points}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-slate-500">{p.reason}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => {
  const themes: any = {
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
    rose: { bg: 'bg-rose-100 dark:bg-rose-900/50', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' }
  };
  const theme = themes[color];

  return (
    <div className={`p-6 rounded-[2rem] border ${theme.bg} ${theme.border} flex flex-col items-center gap-4 transition-all hover:shadow-xl hover:scale-105`}>
      <div className={`p-4 bg-white/80 dark:bg-slate-900/50 rounded-2xl shadow-lg ${theme.text}`}>
        <Icon size={32} />
      </div>
      <div className="text-center">
        <p className={`text-5xl font-black mb-1 ${theme.text}`}>{value}</p>
        <p className="text-[11px] font-black uppercase opacity-70 ${theme.text}">{label}</p>
      </div>
    </div>
  );
};
