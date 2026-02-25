
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from "react-router-dom";
import { storageService } from '../services/storageService';
import { Servant, AttendanceRecord } from '../types';
import { 
  ArrowRight, Church, Users, ShieldCheck, 
  Calendar, Award, LogOut, Hash, Check, 
  TrendingUp, Star, FileDown, Loader2, UserCircle
} from 'lucide-react';
import { formatDateArabic, getActiveFriday } from '../constants';

export const ServantProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [servant, setServant] = useState<Servant | null>(null);
  const [weeklyHistory, setWeeklyHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState({ 
    present: 0, absent: 0, totalFridays: 0, 
    liturgy: 0, meeting: 0, visitation: 0 
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const allServants = storageService.getServants();
    const found = allServants.find(s => s.id === id);
    if (found) {
      setServant(found);
      loadDetailedStats(found);
    } else {
      navigate('/servants');
    }
  }, [id, navigate]);

  const loadDetailedStats = (found: Servant) => {
    const allRecords = storageService.getAttendance().filter(r => r.servantId === found.id);
    const history = [];
    let tempDate = new Date(getActiveFriday());
    for (let i = 0; i < 12; i++) {
      const dateStr = tempDate.toISOString().split('T')[0];
      const record = allRecords.find(r => r.date === dateStr);
      const isPresent = record && (record.liturgy || record.meeting);
      
      history.push({
        date: dateStr,
        formatted: formatDateArabic(dateStr),
        status: isPresent ? 'present' : 'absent',
        record: record || { liturgy: false, meeting: false }
      });
      tempDate.setDate(tempDate.getDate() - 7);
    }
    setWeeklyHistory(history);
    setSummary({
      present: history.filter(h => h.status === 'present').length,
      absent: history.filter(h => h.status === 'absent').length,
      totalFridays: history.length,
      liturgy: allRecords.filter(r => r.liturgy).length,
      meeting: allRecords.filter(r => r.meeting).length,
      visitation: allRecords.filter(r => r.visitation).length
    });
  };

  const isSpecial = storageService.isSpecialAccess();

  if (!servant) return null;
  const attendanceRate = summary.totalFridays > 0 ? Math.round((summary.present / summary.totalFridays) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto pb-20 font-['Cairo']">
      <div className="flex justify-between items-center mb-10">
        <Link to={isSpecial ? "/special-follow-up" : "/servants"} className="flex items-center gap-2 text-slate-600 font-black bg-white border px-6 py-3 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
          <ArrowRight size={20} /> العودة {isSpecial ? "للمتابعة الخاصة" : "لقائمة الخدام"}
        </Link>
        <button className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all">
          <FileDown size={20} /> تحميل ملف الخادم PDF
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 shadow-lg border border-slate-100 dark:border-slate-800 mb-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-40 h-40 md:w-48 md:h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center text-white text-6xl font-black shadow-2xl border-8 border-white dark:border-slate-800">
            {servant.name[0]}
          </div>
          <div className="text-center md:text-right flex-1">
            <p className="text-blue-600 font-bold mb-2">ملف الخادم الأمين</p>
            <h2 className="text-5xl md:text-6xl font-black text-slate-800 dark:text-white mb-4 leading-tight">{servant.name}</h2>
            <div className="flex flex-wrap gap-3 mb-6 justify-center md:justify-start">
              <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-5 py-2 rounded-full text-sm font-black border border-blue-200 dark:border-blue-800 flex items-center gap-2">
                <Award size={16} /> {servant.role}
              </span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-5 py-2 rounded-full text-sm font-black border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <Hash size={16} /> كود الخادم: {servant.code}
              </span>
            </div>
            <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1 border border-slate-200 dark:border-slate-700">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000" style={{ width: `${attendanceRate}%` }}></div>
            </div>
            <p className="mt-2 text-xs font-black text-slate-400">نسبة الالتزام بالخدمة: {attendanceRate}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Church size={32} /></div>
          <div className="text-center">
            <p className="text-4xl font-black text-slate-800 dark:text-white">{summary.liturgy}</p>
            <p className="text-xs font-black text-slate-400 uppercase">حضور قداسات</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Users size={32} /></div>
          <div className="text-center">
            <p className="text-4xl font-black text-slate-800 dark:text-white">{summary.meeting}</p>
            <p className="text-xs font-black text-slate-400 uppercase">حضور اجتماعات</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><TrendingUp size={32} /></div>
          <div className="text-center">
            <p className="text-4xl font-black text-slate-800 dark:text-white">{summary.visitation}</p>
            <p className="text-xs font-black text-slate-400 uppercase">عمليات افتقاد</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <Calendar className="text-blue-600" /> سجل التزام الخادم
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-4">التاريخ</th>
                <th className="px-8 py-4 text-center">الحالة</th>
                <th className="px-8 py-4 text-center">قداس</th>
                <th className="px-8 py-4 text-center">اجتماع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {weeklyHistory.map((h, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-8 py-5">
                    <p className="font-black text-slate-700 dark:text-slate-200 text-sm">{h.formatted}</p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${ 
                      h.status === 'present' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 
                      'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}>
                      {h.status === 'present' ? 'حضور' : 'غياب'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    {h.record.liturgy ? <Check size={20} className="mx-auto text-emerald-500" /> : <span className="text-slate-300 dark:text-slate-700">—</span>}
                  </td>
                  <td className="px-8 py-5 text-center">
                    {h.record.meeting ? <Check size={20} className="mx-auto text-emerald-500" /> : <span className="text-slate-300 dark:text-slate-700">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
