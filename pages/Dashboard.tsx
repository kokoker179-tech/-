
import React, { useEffect, useState } from 'react';
/* Fix: Import Link from react-router-dom to resolve "Cannot find name 'Link'" error */
import { Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { getActiveFriday, getRecentFridays, formatDateArabic } from '../constants';
import { WeeklyStats, Youth, AttendanceRecord } from '../types';
import { 
  CalendarDays, Sparkles, Clock, AlertTriangle, TrendingUp, 
  ShieldCheck, BookOpen, Heart, Church, Users, Award, 
  ChevronLeft, BarChart3, Wine, Shirt
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, LineChart, Line 
} from 'recharts';

interface ExtendedStats extends WeeklyStats {
  bibleReaders: number;
  confessedToday: number;
  visitedToday: number;
  communionToday: number;
  attendanceTrend: { date: string; count: number }[];
  totalYouth: number;
  totalServants: number;
  absentToday: number;
  newYouthMonth: number;
  weeklyCommitmentRate: number;
  gradeDistribution: { name: string; value: number }[];
  regionDistribution: { name: string; value: number }[];
  // Long-term averages
  avgAttendance: number;
  avgLiturgy: number;
  avgMeeting: number;
  avgBible: number;
  avgConfession: number;
  avgVisitation: number;
  avgCommunion: number;
  avgTonia: number;
  liturgyOnlyToday: number;
  liturgyAndCommunionToday: number;
  liturgyCommunionToniaToday: number;
  liturgyOnlyList: Youth[];
  liturgyAndCommunionList: Youth[];
  liturgyCommunionToniaList: Youth[];
}

export const Dashboard: React.FC = () => {
  const [activeDate, setActiveDate] = useState(getActiveFriday());
  const [stats, setStats] = useState<ExtendedStats>({ 
    totalToday: 0, totalLiturgy: 0, totalMeeting: 0, earlyBirds: 0,
    bibleReaders: 0, confessedToday: 0, visitedToday: 0, communionToday: 0,
    attendanceTrend: [], totalYouth: 0, totalServants: 0, absentToday: 0,
    newYouthMonth: 0, weeklyCommitmentRate: 0, gradeDistribution: [], regionDistribution: [],
    avgAttendance: 0, avgLiturgy: 0, avgMeeting: 0, avgBible: 0, avgConfession: 0, avgVisitation: 0, avgCommunion: 0, avgTonia: 0,
    liturgyOnlyToday: 0, liturgyAndCommunionToday: 0, liturgyCommunionToniaToday: 0,
    liturgyOnlyList: [], liturgyAndCommunionList: [], liturgyCommunionToniaList: []
  });
  const [confessionAlerts, setConfessionAlerts] = useState<Youth[]>([]);
  const [visitationAlerts, setVisitationAlerts] = useState<Youth[]>([]);
  const [attendanceAlerts, setAttendanceAlerts] = useState<Youth[]>([]);
  const [noCommunionAlerts, setNoCommunionAlerts] = useState<Youth[]>([]);
  const [consecutiveAbsenceAlerts, setConsecutiveAbsenceAlerts] = useState<Youth[]>([]);
  const lang = storageService.getLang();
  const recentFridaysList = getRecentFridays(12);

  const loadData = async () => {
    const youthList = await storageService.getYouth();
    const servantsList = await storageService.getServants();
    const allRecords = await storageService.getAttendance();
    const currentFri = activeDate;
    const recentFridays = getRecentFridays(6).reverse();

    const todayRecords = allRecords.filter(r => r.date === currentFri && (r.liturgy || r.meeting));
    
    // إحصائيات اليوم المحدد
    const early = todayRecords.filter(r => r.liturgyTime && r.liturgyTime < "08:15").length;
    
    // الاتجاه العام للحضور (آخر 6 أسابيع)
    const trend = recentFridays.map(date => ({
      date: date.split('-').slice(1).join('/'),
      count: allRecords.filter(r => r.date === date && (r.liturgy || r.meeting)).length
    }));

    // حساب المتوسطات طويلة المدى (بناءً على الأسابيع المتاحة منذ بدء النظام)
    const longTermFridays = getRecentFridays(8);
    const weeksCount = longTermFridays.length || 1;
    const ltRecords = allRecords.filter(r => longTermFridays.includes(r.date));
    const avgAtt = ltRecords.filter(r => r.liturgy || r.meeting).length / weeksCount;
    const avgLit = ltRecords.filter(r => r.liturgy).length / weeksCount;
    const avgMeet = ltRecords.filter(r => r.meeting).length / weeksCount;
    const avgBib = ltRecords.filter(r => r.bibleReading).length / weeksCount;
    const avgConf = ltRecords.filter(r => r.confession).length / weeksCount;
    const avgVis = ltRecords.filter(r => r.visitation).length / weeksCount;
    const avgCom = ltRecords.filter(r => r.communion).length / weeksCount;
    const avgTon = ltRecords.filter(r => r.tonia).length / weeksCount;

    // الشباب الجدد (آخر 30 يوم)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const newYouth = youthList.filter(y => y.addedAt && y.addedAt > thirtyDaysAgo).length;

    // نسبة الاستمرارية (حضروا 3 من آخر 4 أسابيع)
    const last4Fridays = getRecentFridays(4);
    const regularYouth = youthList.filter(y => {
      const attendanceCount = allRecords.filter(r => r.youthId === y.id && last4Fridays.includes(r.date) && (r.liturgy || r.meeting)).length;
      return attendanceCount >= 3;
    }).length;

    // توزيع المراحل الدراسية للحضور اليوم
    const grades = storageService.getConfig().grades;
    const gDist = grades.map(g => ({
      name: g,
      value: todayRecords.filter(r => {
        const y = youthList.find(youth => youth.id === r.youthId);
        return y?.grade === g;
      }).length
    }));

    // توزيع المناطق للحضور اليوم
    const regions = ["ترعة عبد العال", "منطقة الكنيسة والتقسيم", "منطقة الملكة", "منطقة أبو زيد"];
    const rDist = regions.map(r => ({
      name: r,
      value: todayRecords.filter(rec => {
        const y = youthList.find(youth => youth.id === rec.youthId);
        // Handle backward compatibility for old records
        if (r === "منطقة الكنيسة والتقسيم") {
          return y?.region === "منطقة الكنيسة والتقسيم" || y?.region === "منطقة الكنيسة" || y?.region === "التقسيم";
        }
        if (r === "ترعة عبد العال") {
          return y?.region === "ترعة عبد العال" || y?.region === "منطقة ترعة عبد العال" || y?.region === "ترعة عبد العال 1" || y?.region === "ترعة عبد العال 2";
        }
        return y?.region === r;
      }).length
    }));

    const liturgyOnlyRecs = todayRecords.filter(r => r.liturgy && !r.communion && !r.tonia);
    const liturgyAndCommunionRecs = todayRecords.filter(r => r.liturgy && r.communion && !r.tonia);
    const liturgyCommunionToniaRecs = todayRecords.filter(r => r.liturgy && r.communion && r.tonia);

    const mapToYouth = (recs: AttendanceRecord[]) => recs.map(r => youthList.find(y => y.id === r.youthId)).filter(Boolean) as Youth[];

    // حساب نسبة الالتزام للأسبوع المحدد بناءً على نظام النقاط
    let totalEarnedPoints = 0;
    const maxPoints = youthList.length * 2; // الأساس: قداس واجتماع لكل شاب
    
    todayRecords.forEach(r => {
      const liturgy = r.liturgy ? 1 : 0;
      const meeting = r.meeting ? 1 : 0;
      const communion = r.communion ? 0.5 : 0;
      const confession = r.confession ? 0.5 : 0;
      const bible = r.bibleReading ? 0.5 : 0;
      totalEarnedPoints += liturgy + meeting + communion + confession + bible;
    });
    
    const weeklyCommitmentRate = maxPoints > 0 ? Math.min(100, Math.round((totalEarnedPoints / maxPoints) * 100)) : 0;

    setStats({
      totalToday: todayRecords.length,
      totalLiturgy: todayRecords.filter(r => r.liturgy).length,
      totalMeeting: todayRecords.filter(r => r.meeting).length,
      earlyBirds: early,
      bibleReaders: todayRecords.filter(r => r.bibleReading).length,
      confessedToday: todayRecords.filter(r => r.confession).length,
      visitedToday: todayRecords.filter(r => r.visitation).length,
      communionToday: todayRecords.filter(r => r.communion).length,
      attendanceTrend: trend,
      totalYouth: youthList.length,
      totalServants: servantsList.length,
      absentToday: Math.max(0, youthList.length - todayRecords.length),
      newYouthMonth: newYouth,
      weeklyCommitmentRate,
      gradeDistribution: gDist,
      regionDistribution: rDist,
      avgAttendance: avgAtt,
      avgLiturgy: avgLit,
      avgMeeting: avgMeet,
      avgBible: avgBib,
      avgConfession: avgConf,
      avgVisitation: avgVis,
      avgCommunion: avgCom,
      avgTonia: avgTon,
      liturgyOnlyToday: liturgyOnlyRecs.length,
      liturgyAndCommunionToday: liturgyAndCommunionRecs.length,
      liturgyCommunionToniaToday: liturgyCommunionToniaRecs.length,
      liturgyOnlyList: mapToYouth(liturgyOnlyRecs),
      liturgyAndCommunionList: mapToYouth(liturgyAndCommunionRecs),
      liturgyCommunionToniaList: mapToYouth(liturgyCommunionToniaRecs)
    });

    // تنبيهات الاعتراف (الذين لم يعترفوا في آخر شهر)
    const lastFourWeeks = getRecentFridays(4);
    const cAlerts = youthList.filter(y => {
      const hasConfessedRecently = allRecords.some(r => r.youthId === y.id && (r.confession || r.confessionDate) && lastFourWeeks.includes(r.date));
      return !hasConfessedRecently;
    }).slice(0, 10);
    
    setConfessionAlerts(cAlerts);

    // تنبيهات الافتقاد (الذين لم يتم افتقادهم في آخر أسبوعين)
    const lastTwoWeeks = getRecentFridays(2);
    const vAlerts = youthList.filter(y => {
      const wasVisited = allRecords.some(r => r.youthId === y.id && r.visitation && lastTwoWeeks.includes(r.date));
      return !wasVisited;
    }).slice(0, 10);

    setVisitationAlerts(vAlerts);

    // تنبيهات الحضور (الذين غابوا عن الجمعة المختارة)
    const attendeesIds = todayRecords.map(r => r.youthId);
    const aAlerts = youthList.filter(y => !attendeesIds.includes(y.id)).slice(0, 10);
    setAttendanceAlerts(aAlerts);

    // تنبيهات التناول (الذين حضروا القداس ولم يتناولوا)
    const ncAlerts = youthList.filter(y => {
      const rec = todayRecords.find(r => r.youthId === y.id);
      return rec?.liturgy && !rec?.communion;
    }).slice(0, 10);
    setNoCommunionAlerts(ncAlerts);

    // تنبيهات الغياب المتكرر (أسبوعين متتاليين)
    const lastTwoFridays = getRecentFridays(2);
    const caAlerts = lastTwoFridays.length === 2 ? youthList.filter(y => {
      const wasPresentWeek1 = allRecords.some(r => r.youthId === y.id && r.date === lastTwoFridays[0] && (r.liturgy || r.meeting));
      const wasPresentWeek2 = allRecords.some(r => r.youthId === y.id && r.date === lastTwoFridays[1] && (r.liturgy || r.meeting));
      return !wasPresentWeek1 && !wasPresentWeek2;
    }).slice(0, 10) : [];
    setConsecutiveAbsenceAlerts(caAlerts);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage_updated', loadData);
    return () => window.removeEventListener('storage_updated', loadData);
  }, [activeDate]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 font-['Cairo']">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-indigo-600 to-amber-600">
            مركز المتابعة الذكي
          </h2>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <p className="text-slate-500 font-bold flex items-center gap-2">
              <CalendarDays size={18} className="text-blue-600" />
              بيانات جمعة: 
            </p>
            <div className="flex items-center gap-2">
              {activeDate === getActiveFriday() && (
                <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-lg shadow-lg shadow-emerald-100 animate-pulse flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  الأسبوع الحالي
                </span>
              )}
              <select 
                value={activeDate} 
                onChange={(e) => setActiveDate(e.target.value)}
                className="px-4 py-2 rounded-xl border-2 border-blue-50 bg-white font-black text-blue-700 outline-none focus:border-blue-500 transition-all shadow-sm"
              >
                {recentFridaysList.map(date => (
                  <option key={date} value={date}>
                    {date === getActiveFriday() ? `🌟 ${formatDateArabic(date)} (الحالية)` : formatDateArabic(date)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
           <div className="px-6 py-3 bg-blue-50 text-blue-700 rounded-2xl font-black text-xs border border-blue-100">
             إجمالي الشباب: {stats.totalYouth}
           </div>
           <div className="px-6 py-3 bg-rose-50 text-rose-700 rounded-2xl font-black text-xs border border-rose-100">
             إجمالي الخدام: {stats.totalServants}
           </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard icon={Users} label="حضور الأسبوع" value={stats.totalToday} sub={`${stats.absentToday} غائب`} color="blue" avg={stats.avgAttendance} />
        <StatCard icon={Church} label="حضور القداس" value={stats.totalLiturgy} sub={`${Math.round((stats.totalLiturgy/stats.totalToday || 0)*100)}% من الحضور`} color="amber" avg={stats.avgLiturgy} />
        <StatCard icon={Wine} label="التناول" value={stats.communionToday} sub={`${Math.round((stats.communionToday/stats.totalLiturgy || 0)*100)}% من القداس`} color="rose" avg={stats.avgCommunion} />
        <StatCard icon={Users} label="حضور الاجتماع" value={stats.totalMeeting} sub={`${Math.round((stats.totalMeeting/stats.totalToday || 0)*100)}% من الحضور`} color="emerald" avg={stats.avgMeeting} />
        <StatCard icon={Award} label="نسبة الالتزام" value={`${stats.weeklyCommitmentRate}%`} sub="لهذا الأسبوع" color="indigo" />
      </div>

      {/* Liturgy Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-[2.5rem] border border-amber-100 dark:border-amber-800 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 shrink-0">
              <Church size={28} />
            </div>
            <div>
              <p className="text-3xl font-black text-amber-700 dark:text-amber-400">{stats.liturgyOnlyToday}</p>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-500">حضر قداس فقط</p>
            </div>
          </div>
          {stats.liturgyOnlyList.length > 0 && (
            <div className="mt-2 pt-4 border-t border-amber-200/50 dark:border-amber-800/50">
              <p className="text-xs font-black text-amber-800 dark:text-amber-300 mb-3">الأسماء:</p>
              <div className="flex flex-wrap gap-2">
                {stats.liturgyOnlyList.map(y => (
                  <span key={y.id} className="text-sm bg-white/60 dark:bg-slate-900/50 text-amber-900 dark:text-amber-200 px-3 py-1.5 rounded-lg font-bold shadow-sm">{y.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-[2.5rem] border border-rose-100 dark:border-rose-800 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 shrink-0">
              <Wine size={28} />
            </div>
            <div>
              <p className="text-3xl font-black text-rose-700 dark:text-rose-400">{stats.liturgyAndCommunionToday}</p>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-500">حضر قداس وتناول</p>
            </div>
          </div>
          {stats.liturgyAndCommunionList.length > 0 && (
            <div className="mt-2 pt-4 border-t border-rose-200/50 dark:border-rose-800/50">
              <p className="text-xs font-black text-rose-800 dark:text-rose-300 mb-3">الأسماء:</p>
              <div className="flex flex-wrap gap-2">
                {stats.liturgyAndCommunionList.map(y => (
                  <span key={y.id} className="text-sm bg-white/60 dark:bg-slate-900/50 text-rose-900 dark:text-rose-200 px-3 py-1.5 rounded-lg font-bold shadow-sm">{y.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-800 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
              <Shirt size={28} />
            </div>
            <div>
              <p className="text-3xl font-black text-indigo-700 dark:text-indigo-400">{stats.liturgyCommunionToniaToday}</p>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-500">حضر قداس وتناول وتونية</p>
            </div>
          </div>
          {stats.liturgyCommunionToniaList.length > 0 && (
            <div className="mt-2 pt-4 border-t border-indigo-200/50 dark:border-indigo-800/50">
              <p className="text-xs font-black text-indigo-800 dark:text-indigo-300 mb-3">الأسماء:</p>
              <div className="flex flex-wrap gap-2">
                {stats.liturgyCommunionToniaList.map(y => (
                  <span key={y.id} className="text-sm bg-white/60 dark:bg-slate-900/50 text-indigo-900 dark:text-indigo-200 px-3 py-1.5 rounded-lg font-bold shadow-sm">{y.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <TrendingUp className="text-blue-600" /> اتجاه الحضور الأسبوعي
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#64748b'}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'Cairo' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {stats.attendanceTrend.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === stats.attendanceTrend.length - 1 ? '#2563eb' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
            <Award className="text-amber-500" /> معدلات الأنشطة (أسبوعي vs دائم)
          </h3>
          <div className="space-y-4">
             <div className="flex flex-col gap-3">
                <MiniIndicator label="حضور قداس" percent={(stats.totalLiturgy/stats.totalToday || 0)*100} avg={(stats.avgLiturgy/stats.avgAttendance || 0)*100} color="amber" />
                <MiniIndicator label="التناول" percent={(stats.communionToday/stats.totalLiturgy || 0)*100} avg={(stats.avgCommunion/stats.avgLiturgy || 0)*100} color="rose" />
                <MiniIndicator label="التونية" percent={(stats.liturgyCommunionToniaToday/stats.totalLiturgy || 0)*100} avg={(stats.avgTonia/stats.avgLiturgy || 0)*100} color="indigo" />
                <MiniIndicator label="حضور اجتماع" percent={(stats.totalMeeting/stats.totalToday || 0)*100} avg={(stats.avgMeeting/stats.avgAttendance || 0)*100} color="emerald" />
                <MiniIndicator label="قراءة إنجيل" percent={(stats.bibleReaders/stats.totalToday || 0)*100} avg={(stats.avgBible/stats.avgAttendance || 0)*100} color="indigo" />
                <MiniIndicator label="اعتراف" percent={(stats.confessedToday/stats.totalToday || 0)*100} avg={(stats.avgConfession/stats.avgAttendance || 0)*100} color="purple" />
                <MiniIndicator label="افتقاد" percent={(stats.visitedToday/stats.totalToday || 0)*100} avg={(stats.avgVisitation/stats.avgAttendance || 0)*100} color="rose" />
             </div>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
            <BarChart3 className="text-blue-600" /> توزيع المراحل (اليوم)
          </h3>
          <div className="space-y-4">
            {stats.gradeDistribution.map((g, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">{g.name}</span>
                  <span className="text-blue-600">{g.value} شاب</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${(g.value / stats.totalToday || 0) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Region Distribution */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
            <BarChart3 className="text-emerald-600" /> توزيع المناطق (اليوم)
          </h3>
          <div className="space-y-4">
            {stats.regionDistribution.map((r, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">{r.name}</span>
                  <span className="text-emerald-600">{r.value} شاب</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${(r.value / stats.totalToday || 0) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Confession Alerts */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
            <h3 className="font-black text-purple-800 flex items-center gap-2"><ShieldCheck size={20} /> يحتاجون لمتابعة اعتراف (شهر)</h3>
            <span className="text-[10px] font-black bg-purple-600 text-white px-2 py-1 rounded-full">{confessionAlerts.length}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {confessionAlerts.length > 0 ? confessionAlerts.map(y => (
              <div key={y.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-black">{y.name[0]}</div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">{y.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{y.grade}</p>
                  </div>
                </div>
                <Link to={`/youth-profile/${y.id}`} className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-all"><ChevronLeft size={18} /></Link>
              </div>
            )) : (
              <div className="p-10 text-center text-slate-400 font-bold">كل الشباب معترفين قريباً 🎉</div>
            )}
          </div>
        </div>

        {/* Visitation Alerts */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
            <h3 className="font-black text-rose-800 flex items-center gap-2"><Heart size={20} /> يحتاجون لافتقاد (أسبوعين)</h3>
            <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-1 rounded-full">{visitationAlerts.length}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {visitationAlerts.length > 0 ? visitationAlerts.map(y => (
              <div key={y.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black">{y.name[0]}</div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">{y.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{y.phone || 'بدون هاتف'}</p>
                  </div>
                </div>
                <a href={`tel:${y.phone}`} className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-all"><Heart size={18} /></a>
              </div>
            )) : (
              <div className="p-10 text-center text-slate-400 font-bold">تم افتقاد الجميع بنجاح ❤️</div>
            )}
          </div>
        </div>

        {/* No Communion Alerts */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden lg:col-span-2">
          <div className="p-6 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
            <h3 className="font-black text-rose-800 flex items-center gap-2"><Wine size={20} /> حضروا القداس ولم يتناولوا (هذا الأسبوع)</h3>
            <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-1 rounded-full">{noCommunionAlerts.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-50 rtl:divide-x-reverse">
            {noCommunionAlerts.length > 0 ? noCommunionAlerts.map(y => (
              <div key={y.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black">{y.name[0]}</div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">{y.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{y.grade} | {y.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${y.phone}`} className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-all"><Heart size={18} /></a>
                  <Link to={`/youth-profile/${y.id}`} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all"><ChevronLeft size={18} /></Link>
                </div>
              </div>
            )) : (
              <div className="p-10 text-center text-slate-400 font-bold col-span-2">الكل تناول اليوم! بركة كبيرة 🎉</div>
            )}
          </div>
        </div>

        {/* Attendance Alerts */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden lg:col-span-2">
          <div className="p-6 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <h3 className="font-black text-blue-800 flex items-center gap-2"><Users size={20} /> غائبون عن هذا الأسبوع (قداس واجتماع)</h3>
            <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-1 rounded-full">{attendanceAlerts.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-50 rtl:divide-x-reverse">
            {attendanceAlerts.length > 0 ? attendanceAlerts.map(y => (
              <div key={y.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">{y.name[0]}</div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">{y.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{y.grade} | {y.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${y.phone}`} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"><Heart size={18} /></a>
                  <Link to={`/youth-profile/${y.id}`} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all"><ChevronLeft size={18} /></Link>
                </div>
              </div>
            )) : (
              <div className="p-10 text-center text-slate-400 font-bold col-span-2">الكل حضر اليوم! مبروك 🎉</div>
            )}
          </div>
        </div>

        {/* Consecutive Absence Alerts */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden lg:col-span-2">
          <div className="p-6 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
            <h3 className="font-black text-orange-800 flex items-center gap-2"><AlertTriangle size={20} /> غياب متكرر (أسبوعين متتاليين)</h3>
            <span className="text-[10px] font-black bg-orange-600 text-white px-2 py-1 rounded-full">{consecutiveAbsenceAlerts.length}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {consecutiveAbsenceAlerts.length > 0 ? consecutiveAbsenceAlerts.map(y => (
              <div key={y.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-lg">{y.name[0]}</div>
                  <div>
                    <p className="font-black text-slate-800">{y.name}</p>
                    <p className="text-xs text-slate-500 font-bold">{y.grade} | {y.phone}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1">
                      <span className="text-orange-500">العنوان:</span> {y.address || 'غير مسجل'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`tel:${y.phone}`} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl font-black text-xs shadow-lg shadow-orange-100">
                    <Heart size={14} /> اتصال للافتقاد
                  </a>
                  <Link to={`/youth-profile/${y.id}`} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all">
                    <ChevronLeft size={20} />
                  </Link>
                </div>
              </div>
            )) : (
              <div className="p-10 text-center text-slate-400 font-bold">لا يوجد غياب متكرر حالياً 🎉</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color, avg }: any) => {
  const colors: any = {
    blue: 'bg-blue-600 shadow-blue-100',
    amber: 'bg-amber-500 shadow-amber-100',
    indigo: 'bg-indigo-600 shadow-indigo-100',
    purple: 'bg-purple-600 shadow-purple-100',
    rose: 'bg-rose-600 shadow-rose-100',
    emerald: 'bg-emerald-600 shadow-emerald-100'
  };
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-4 hover:shadow-md transition-all relative overflow-hidden">
      {avg !== undefined && (
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
          <div 
            className={`h-full ${colors[color]} opacity-20`} 
            style={{ width: `${Math.min(100, (value / (avg || 1)) * 100)}%` }}
          ></div>
        </div>
      )}
      <div className={`w-14 h-14 ${colors[color]} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-3xl font-black text-slate-800 dark:text-white">{value}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="text-[9px] font-bold text-slate-300">{sub}</p>
        {avg !== undefined && (
          <p className="text-[8px] font-black text-slate-400 mt-2 uppercase">المتوسط: {Math.round(avg)}</p>
        )}
      </div>
    </div>
  );
};

const MiniIndicator = ({ label, percent, avg, color }: any) => {
  const colors: any = { 
    amber: 'bg-amber-500', 
    emerald: 'bg-emerald-500', 
    rose: 'bg-rose-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500'
  };
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-[10px] font-black">
        <span className="text-slate-500 uppercase">{label}</span>
        <div className="flex gap-2">
          <span className="text-slate-400">دائم: {Math.round(avg)}%</span>
          <span className="text-slate-800">أسبوعي: {Math.round(percent)}%</span>
        </div>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
        <div className={`h-full ${colors[color]} transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
        <div className="absolute top-0 h-full w-0.5 bg-slate-400 opacity-50" style={{ left: `${avg}%` }}></div>
      </div>
    </div>
  );
};
