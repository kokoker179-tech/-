
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from "react-router-dom";
import { storageService } from '../services/storageService';
import { Youth, AttendanceRecord } from '../types';
import { 
  ArrowRight, Church, Users, BookOpen, ShieldCheck, 
  Calendar, Share2, Award, LogOut, Hash, Check, 
  TrendingUp, Star, Trophy, Target, FileDown, Loader2, X
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell
} from 'recharts';
import { isPastDeadline, formatDateArabic, getActiveFriday } from '../constants';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface YouthProfileProps {
  onLogout?: () => void;
}

export const YouthProfile: React.FC<YouthProfileProps> = ({ onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [youth, setYouth] = useState<Youth | null>(null);
  const [activityStats, setActivityStats] = useState<any[]>([]);
  const [weeklyHistory, setWeeklyHistory] = useState<any[]>([]);
  const [summary, setSummary] = useState({ 
    present: 0, absent: 0, totalFridays: 0, 
    liturgy: 0, meeting: 0, bible: 0, confession: 0, visitation: 0 
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const adminStatus = storageService.isLoggedIn();
    setIsAdmin(adminStatus);
    const allYouth = storageService.getYouth();
    const found = allYouth.find(y => y.id === id);
    if (found) {
      setYouth(found);
      loadDetailedStats(found);
    } else {
      if (id !== 'portal') navigate('/');
    }
  }, [id, navigate]);

  const loadDetailedStats = (found: Youth) => {
    const allRecords = storageService.getAttendance().filter(r => r.youthId === found.id);
    const joinDateStr = new Date(found.addedAt).toISOString().split('T')[0];
    const history = [];
    let tempDate = new Date(getActiveFriday());
    for (let i = 0; i < 20; i++) {
      const dateStr = tempDate.toISOString().split('T')[0];
      if (dateStr >= joinDateStr) {
        const record = allRecords.find(r => r.date === dateStr);
        const isPast = isPastDeadline(dateStr);
        const isPresent = record && (record.liturgy || record.meeting || record.visitation || record.bibleReading || record.confession);
        history.push({
          date: dateStr,
          formatted: formatDateArabic(dateStr),
          status: isPresent ? 'present' : (isPast ? 'absent' : 'pending'),
          record: record || { liturgy: false, meeting: false, visitation: false, bibleReading: false, confession: false }
        });
      }
      tempDate.setDate(tempDate.getDate() - 7);
    }
    setWeeklyHistory(history);
    setSummary({
      present: history.filter(h => h.status === 'present').length,
      absent: history.filter(h => h.status === 'absent').length,
      totalFridays: history.length,
      liturgy: allRecords.filter(r => r.liturgy).length,
      meeting: allRecords.filter(r => r.meeting).length,
      bible: allRecords.filter(r => r.bibleReading).length,
      confession: allRecords.filter(r => r.confession).length,
      visitation: allRecords.filter(r => r.visitation).length
    });
  };

  const handleDeleteYouth = async () => {
    if (!youth) return;
    if (window.confirm(`⚠️ حذف نهائي وبات!\n\nهل أنت متأكد من مسح الشاب "${youth.name}" وكل بياناته؟\nلا يمكن التراجع بعد الحذف من السحاب.`)) {
      setIsDeleting(true);
      const success = await storageService.deleteYouth(youth.id);
      if (success) navigate('/youth-list');
      else {
        alert('فشل الحذف.. حاول لاحقاً');
        setIsDeleting(false);
      }
    }
  };

  const downloadPDFReport = async () => {
    if (!youth) return;
    setIsGenerating(true);
    const reportContainer = document.createElement('div');
    reportContainer.style.position = 'absolute';
    reportContainer.style.left = '-9999px';
    reportContainer.style.width = '1000px';
    reportContainer.style.backgroundColor = '#ffffff';
    reportContainer.style.padding = '60px';
    reportContainer.dir = 'rtl';
    reportContainer.style.fontFamily = "'Cairo', sans-serif";

    const attendanceRate = summary.totalFridays > 0 ? Math.round((summary.present / summary.totalFridays) * 100) : 0;
    const historyRows = weeklyHistory.map((h, i) => `
      <tr style="border-bottom: 1px solid #edf2f7; background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 15px; font-weight: 700;">${h.formatted}</td>
        <td style="text-align: center;"><span style="padding: 4px 12px; border-radius: 8px; font-weight: 900; ${h.status === 'present' ? 'background: #d1fae5; color: #065f46;' : 'background: #fee2e2; color: #991b1b;'}">${h.status === 'present' ? 'حضور' : 'غياب'}</span></td>
        <td style="text-align: center;">${h.record.liturgy ? '●' : '—'}</td>
        <td style="text-align: center;">${h.record.meeting ? '●' : '—'}</td>
        <td style="text-align: center;">${h.record.bibleReading ? '●' : '—'}</td>
        <td style="text-align: center;">${h.record.confession ? '●' : '—'}</td>
      </tr>`).join('');

    reportContainer.innerHTML = `<div style="border: 1px solid #e2e8f0; padding: 40px; border-radius: 40px;">
        <h1 style="color: #1e3a8a;">تقرير التميز: ${youth.name}</h1>
        <p>كنيسة رئيس الملائكة روفائيل - اجتماع ثانوي بنين</p>
        <div style="margin: 40px 0; background: #f8fafc; padding: 30px; border-radius: 20px;">
           <h3>معدل الالتزام: ${attendanceRate}%</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
           <thead><tr style="background: #f1f5f9;"><th>التاريخ</th><th>الحالة</th><th>قداس</th><th>اجتماع</th><th>إنجيل</th><th>اعتراف</th></tr></thead>
           <tbody>${historyRows}</tbody>
        </table>
    </div>`;
    document.body.appendChild(reportContainer);
    try {
      const canvas = await html2canvas(reportContainer, { scale: 3, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, (canvas.height * 210) / canvas.width);
      pdf.save(`تقرير_${youth.name}.pdf`);
    } finally {
      document.body.removeChild(reportContainer);
      setIsGenerating(false);
    }
  };

  const handleFullLogout = () => { if (onLogout) onLogout(); else { storageService.logout(); navigate('/'); } };
  const shareMyProfile = () => {
    const link = `${window.location.origin}${window.location.pathname}#/youth-profile/${youth?.id}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  if (!youth) return null;
  const attendanceRate = summary.totalFridays > 0 ? Math.round((summary.present / summary.totalFridays) * 100) : 0;
  
  return (
    <div className="max-w-6xl mx-auto pb-20 font-['Cairo'] relative">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {isAdmin ? (
            <div className="flex gap-2">
              <Link to="/youth-list" className="flex items-center gap-2 text-slate-600 font-black bg-white border px-6 py-3 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                <ArrowRight size={20} /> العودة
              </Link>
              <button onClick={handleDeleteYouth} disabled={isDeleting} className="flex items-center gap-2 bg-rose-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:bg-rose-700 transition-all">
                {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <X size={20} />}
                حذف الملف نهائياً
              </button>
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

      <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 mb-8 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="relative">
            {youth.image ? (
              <img src={youth.image} alt={youth.name} className="w-44 h-44 rounded-[3rem] object-cover shadow-2xl border-4 border-white" />
            ) : (
              <div className="w-44 h-44 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[3rem] flex items-center justify-center text-white text-6xl font-black shadow-2xl">{youth.name[0]}</div>
            )}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full shadow-xl border-2 border-white font-black text-xs bg-amber-50 text-amber-600">
              التزام {attendanceRate}%
            </div>
          </div>
          <div className="text-center md:text-right flex-1">
            <h2 className="text-4xl font-black text-slate-800 mb-4">{youth.name}</h2>
            <div className="flex flex-wrap gap-3 mb-8 justify-center md:justify-start">
              <span className="bg-blue-50 text-blue-600 px-5 py-2 rounded-full text-sm font-black border border-blue-100 flex items-center gap-2">
                <Target size={16} /> {youth.grade}
              </span>
              <span className="bg-slate-50 text-slate-500 px-5 py-2 rounded-full text-sm font-black border border-slate-100 flex items-center gap-2">
                <Hash size={16} /> الكود: {youth.code}
              </span>
            </div>
            <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500" style={{ width: `${attendanceRate}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard icon={Church} label="القداسات" value={summary.liturgy} color="amber" />
        <StatCard icon={Users} label="الاجتماعات" value={summary.meeting} color="emerald" />
        <StatCard icon={BookOpen} label="قراءات إنجيل" value={summary.bible} color="blue" />
        <StatCard icon={ShieldCheck} label="سراعتراف" value={summary.confession} color="purple" />
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => {
  const themes: any = { amber: 'bg-amber-50 text-amber-600', emerald: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600' };
  return (
    <div className={`p-8 rounded-[2.5rem] border flex flex-col items-center gap-4 transition-all hover:shadow-lg ${themes[color]}`}>
      <div className="p-4 bg-white rounded-2xl shadow-sm"><Icon size={28} /></div>
      <div className="text-center">
        <p className="text-4xl font-black mb-1">{value}</p>
        <p className="text-[10px] font-black uppercase opacity-70">{label}</p>
      </div>
    </div>
  );
};
