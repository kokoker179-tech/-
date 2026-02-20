
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Church, Calendar, UserMinus, Star } from 'lucide-react';
import { WeeklyStats } from '../types';
import { storageService } from '../services/storageService';

interface DashboardStatsProps {
  stats: WeeklyStats;
  percentage: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, percentage }) => {
  const totalYouth = storageService.getYouth().length;
  const totalAbsent = Math.max(0, totalYouth - stats.totalToday);
  const theme = storageService.getTheme();
  const lang = storageService.getLang();

  const data = [
    { name: 'حضور', value: stats.totalToday },
    { name: 'غياب', value: totalAbsent },
  ];
  const COLORS = ['#2563eb', theme === 'dark' ? '#1e293b' : '#f1f5f9'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Today Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 dark:shadow-none">
          <Calendar size={28} />
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">{lang === 'ar' ? 'حضروا اليوم' : 'Present Today'}</p>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{stats.totalToday}</p>
        </div>
      </div>

      {/* Absent Today Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-100 dark:shadow-none">
          <UserMinus size={28} />
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">{lang === 'ar' ? 'غائبين اليوم' : 'Absent Today'}</p>
          <p className="text-3xl font-black text-rose-600 dark:text-rose-400">{totalAbsent}</p>
        </div>
      </div>

      {/* Liturgy Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100 dark:shadow-none">
          <Church size={28} />
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">{lang === 'ar' ? 'حضور القداس' : 'Liturgy'}</p>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-500">{stats.totalLiturgy}</p>
        </div>
      </div>

      {/* Meeting Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 dark:shadow-none">
          <Users size={28} />
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">{lang === 'ar' ? 'حضور الاجتماع' : 'Meeting'}</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-500">{stats.totalMeeting}</p>
        </div>
      </div>

      {/* Indicator Gauge */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-slate-800 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 opacity-50"></div>
        <div className="flex items-center gap-3 mb-6 self-start">
          <div className="p-2 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg">
            <TrendingUp size={20} />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white">{lang === 'ar' ? 'تحليل الالتزام العام' : 'Overall Commitment Analysis'}</h3>
        </div>
        
        <div className="w-full h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[{v: percentage}, {v: 100 - percentage}]}
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius={80}
                outerRadius={120}
                paddingAngle={0}
                dataKey="v"
                stroke="none"
              >
                <Cell fill="url(#colorGradient)" />
                <Cell fill={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
              </Pie>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
            <span className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-b from-blue-700 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">{Math.round(percentage)}%</span>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-sm mt-1">{lang === 'ar' ? 'نسبة الحضور التراكمية' : 'Cumulative Attendance Rate'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
