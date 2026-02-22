
import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { Marathon, MarathonGroup, MarathonActivityPoints, Youth } from '../types';
import { Trophy, Star, TrendingUp, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const MarathonDashboard: React.FC = () => {
  const [marathons, setMarathons] = useState<Marathon[]>([]);
  const [activeMarathon, setActiveMarathon] = useState<Marathon | null>(null);
  const [groups, setGroups] = useState<MarathonGroup[]>([]);
  const [activityPoints, setActivityPoints] = useState<MarathonActivityPoints[]>([]);
  const [youth, setYouth] = useState<Youth[]>([]);

  const loadData = () => {
    const m = storageService.getMarathons();
    setMarathons(m);
    setGroups(storageService.getMarathonGroups());
    setActivityPoints(storageService.getMarathonActivityPoints());
    setYouth(storageService.getYouth());
    
    if (m.length > 0) {
      const active = m.find(mar => mar.active) || m[0];
      setActiveMarathon(active);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage_updated', loadData);
    return () => window.removeEventListener('storage_updated', loadData);
  }, []);

  const groupStats = useMemo(() => {
    if (!activeMarathon) return [];
    
    const marathonGroups = groups.filter(g => activeMarathon.groupIds.includes(g.id));
    
    return marathonGroups.map(group => {
      const groupYouthPoints = activityPoints.filter(p => 
        p.marathonId === activeMarathon.id && 
        group.youthIds.includes(p.youthId)
      );
      
      const totalPoints = groupYouthPoints.reduce((sum, p) => sum + p.points, 0);
      
      const maxPossiblePerYouthPerWeek = Object.values(activeMarathon.pointSystem).reduce((a: number, b: number) => a + b, 0) as number;
      const weeksElapsed = Math.max(1, Math.ceil((new Date().getTime() - new Date(activeMarathon.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7)));
      const maxPossibleTotal = (group.youthIds.length * maxPossiblePerYouthPerWeek * weeksElapsed) as number;
      const levelPercentage = maxPossibleTotal > 0 ? Math.min(100, Math.round((totalPoints / maxPossibleTotal) * 100)) : 0;

      return {
        ...group,
        totalPoints,
        levelPercentage,
        isWinner: activeMarathon.winnerGroupId === group.id
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [activeMarathon, groups, activityPoints]);

  if (!activeMarathon) {
    return (
      <div className="mt-12 pt-12 border-t-4 border-slate-100 dark:border-slate-800 text-center">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <Trophy size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-black text-slate-400 mb-4">لا يوجد ماراثون نشط حالياً</h3>
          <Link to="/marathon" className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all">
            <Plus size={20} /> ابدأ ماراثون جديد الآن
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-12 pt-12 border-t-4 border-slate-100 dark:border-slate-800">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-black text-slate-800 dark:text-white">لوحة تحكم الماراثون</h3>
        <p className="text-slate-500 font-bold">{activeMarathon.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <h4 className="font-black text-slate-800 dark:text-white">المجموعة المتصدرة</h4>
          </div>
          <p className="text-3xl font-black text-blue-600">{groupStats[0]?.name || '—'}</p>
          <p className="text-sm text-slate-500 font-bold mt-1">بإجمالي {groupStats[0]?.totalPoints || 0} نقطة</p>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
              <Star size={24} />
            </div>
            <h4 className="font-black text-slate-800 dark:text-white">أفضل أداء</h4>
          </div>
          <p className="text-3xl font-black text-emerald-600">{groupStats[0]?.name || '—'}</p>
          <p className="text-sm text-slate-500 font-bold mt-1">المجموعة الأكثر نشاطاً</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-2xl">
              <Trophy size={24} />
            </div>
            <h4 className="font-black text-slate-800 dark:text-white">حالة الماراثون</h4>
          </div>
          <p className={`text-2xl font-black ${activeMarathon.active ? 'text-blue-600' : 'text-rose-600'}`}>
            {activeMarathon.active ? 'جاري الآن' : 'انتهى الماراثون'}
          </p>
          <p className="text-sm text-slate-500 font-bold mt-1">ينتهي في {activeMarathon.endDate}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800">
          <h3 className="text-2xl font-black text-slate-800 dark:text-white">ترتيب المجموعات</h3>
        </div>
        <div className="p-8">
          <div className="space-y-6">
            {groupStats.map((group, index) => (
              <div key={group.id} className="relative">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-sm ${
                      index === 0 ? 'bg-amber-100 text-amber-600' : 
                      index === 1 ? 'bg-slate-100 text-slate-600' : 
                      index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                        {group.name}
                        {group.isWinner && <Trophy size={16} className="text-amber-500 fill-amber-500" />}
                      </h4>
                      <p className="text-xs text-slate-500 font-bold">الخادم: {group.servantName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-600">{group.totalPoints}</span>
                    <span className="text-[10px] font-black text-slate-400 mr-1 uppercase">نقطة</span>
                  </div>
                </div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${group.levelPercentage}%` }}
                    className={`h-full rounded-full bg-gradient-to-r ${
                      index === 0 ? 'from-amber-400 to-amber-600' : 'from-blue-500 to-indigo-600'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
