
import React, { useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { Marathon, MarathonGroup, MarathonPointSystem, Youth, AttendanceRecord, MarathonActivityPoints } from '../types';
import { 
  Trophy, Users, Plus, Edit3, Trash2, Check, X, 
  Download, Calendar, Award, UserPlus, ChevronRight, 
  ChevronLeft, Star, TrendingUp, FileText, Settings,
  Save, AlertCircle, Info, Filter, BookOpen,
  Church, ShieldCheck, Music, Wine, UtensilsCrossed, Brain, Scroll
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_POINT_SYSTEM, formatDateArabic, getActiveFriday, generateMarathonWeeklyReport, generateMarathonFinalReport } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { MarathonDashboard } from '../components/MarathonDashboard';

export const MarathonPage: React.FC = () => {
  const [marathons, setMarathons] = useState<Marathon[]>([]);
  const [activeMarathon, setActiveMarathon] = useState<Marathon | null>(null);
  const [groups, setGroups] = useState<MarathonGroup[]>([]);
  const [youth, setYouth] = useState<Youth[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [activityPoints, setActivityPoints] = useState<MarathonActivityPoints[]>([]);
  
  const [view, setView] = useState<'list' | 'dashboard' | 'groups' | 'points' | 'settings' | 'create'>('list');
  const [isEditing, setIsEditing] = useState(false);
  const [newMarathonData, setNewMarathonData] = useState({
    name: '',
    startDay: '',
    startMonth: '',
    endDay: '',
    endMonth: ''
  });
  const [editingMarathon, setEditingMarathon] = useState<Partial<Marathon>>({});
  const [editingGroup, setEditingGroup] = useState<Partial<MarathonGroup> | null>(null);
  const [youthSearch, setYouthSearch] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(getActiveFriday());

  const loadData = () => {
    const m = storageService.getMarathons();
    setMarathons(m);
    setGroups(storageService.getMarathonGroups());
    setYouth(storageService.getYouth());
    setAttendance(storageService.getAttendance());
    setActivityPoints(storageService.getMarathonActivityPoints());
    
    // If there's an active marathon, select it
    if (!activeMarathon && m.length > 0) {
      const active = m.find(mar => mar.active) || m[0];
      setActiveMarathon(active);
      if (active.active) setView('dashboard');
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage_updated', loadData);
    return () => window.removeEventListener('storage_updated', loadData);
  }, []);

  // Calculate Group Stats
  const groupStats = useMemo(() => {
    if (!activeMarathon) return [];
    
    const marathonGroups = groups.filter(g => activeMarathon.groupIds.includes(g.id));
    
    return marathonGroups.map(group => {
      const groupYouthPoints = activityPoints.filter(p => 
        p.marathonId === activeMarathon.id && 
        group.youthIds.includes(p.youthId)
      );
      
      const totalPoints = groupYouthPoints.reduce((sum, p) => sum + p.points, 0);
      
      // Weekly breakdown
      const weeklyBreakdown: Record<string, number> = {};
      groupYouthPoints.forEach(p => {
        weeklyBreakdown[p.weekDate] = (weeklyBreakdown[p.weekDate] || 0) + p.points;
      });

      // Calculate percentage level (arbitrary max for visualization)
      const maxPossiblePerYouthPerWeek = Object.values(activeMarathon.pointSystem).reduce((a: number, b: number) => a + b, 0) as number;
      const weeksElapsed = Math.max(1, Math.ceil((new Date().getTime() - new Date(activeMarathon.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7)));
      const maxPossibleTotal = (group.youthIds.length * maxPossiblePerYouthPerWeek * weeksElapsed) as number;
      const levelPercentage = maxPossibleTotal > 0 ? Math.min(100, Math.round((totalPoints / maxPossibleTotal) * 100)) : 0;

      return {
        ...group,
        totalPoints,
        weeklyBreakdown,
        levelPercentage,
        isWinner: activeMarathon.winnerGroupId === group.id
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [activeMarathon, groups, activityPoints]);

  const handleCreateMarathon = () => {
    setView('create');
  };

  const handleConfirmCreate = () => {
    if (!newMarathonData.name || !newMarathonData.startDay || !newMarathonData.startMonth || !newMarathonData.endDay || !newMarathonData.endMonth) {
      alert('يرجى إكمال جميع البيانات');
      return;
    }

    const startDate = `2026-${newMarathonData.startMonth.padStart(2, '0')}-${newMarathonData.startDay.padStart(2, '0')}`;
    const endDate = `2026-${newMarathonData.endMonth.padStart(2, '0')}-${newMarathonData.endDay.padStart(2, '0')}`;

    const newMarathon: Marathon = {
      id: uuidv4(),
      name: newMarathonData.name,
      startDate,
      endDate,
      pointSystem: { ...DEFAULT_POINT_SYSTEM },
      groupIds: [],
      active: true
    };
    storageService.addMarathon(newMarathon);
    setActiveMarathon(newMarathon);
    setView('dashboard');
    setNewMarathonData({ name: '', startDay: '', startMonth: '', endDay: '', endMonth: '' });
  };

  const handleSaveMarathon = () => {
    if (activeMarathon) {
      storageService.updateMarathon(activeMarathon);
      setIsEditing(false);
    }
  };

  const handleAddGroup = () => {
    if (!activeMarathon) return;
    const newGroup = storageService.addMarathonGroup(activeMarathon.id, {
      name: 'مجموعة جديدة',
      servantName: 'اسم الخادم',
      youthIds: []
    });
    setEditingGroup(newGroup);
  };

  const handleUpdateGroup = (group: MarathonGroup) => {
    storageService.updateMarathonGroup(group);
    setEditingGroup(null);
  };

  const syncAttendancePoints = () => {
    if (!activeMarathon) return;
    
    const newPoints: MarathonActivityPoints[] = [];
    const currentPoints = storageService.getMarathonActivityPoints();
    
    // Filter out existing automatic points to avoid duplicates
    const manualPoints = currentPoints.filter(p => 
      p.marathonId !== activeMarathon.id || 
      !['liturgy', 'meeting', 'confession', 'tasbeha', 'weeklyCompetition', 'communion', 'exodusCompetition', 'memorizationPart', 'fasting'].includes(p.activity)
    );

    // Process attendance records within marathon dates
    attendance.forEach(record => {
      if (record.date >= activeMarathon.startDate && record.date <= activeMarathon.endDate) {
        const addPoint = (activity: keyof MarathonPointSystem, reason: string) => {
          if (record[activity as keyof typeof record]) {
             newPoints.push({
              marathonId: activeMarathon.id,
              youthId: record.youthId,
              weekDate: record.date,
              activity,
              points: activeMarathon.pointSystem[activity],
              reason,
              timestamp: Date.now()
            });
          }
        };

        addPoint('liturgy', 'حضور القداس الإلهي');
        addPoint('meeting', 'حضور الاجتماع الأسبوعي');
        addPoint('confession', 'ممارسة سر الاعتراف');
        addPoint('tasbeha', 'حضور التسبحة');
        addPoint('weeklyCompetition', 'الفوز في مسابقة الجمعة');
        addPoint('communion', 'التناول من الأسرار المقدسة');
        addPoint('exodusCompetition', 'مسابقة سفر الخروج');
        addPoint('memorizationPart', 'تسميع جزء الحفظ');
        addPoint('fasting', 'الالتزام بالصوم');
      }
    });

    storageService.saveMarathonActivityPoints([...manualPoints, ...newPoints]);
    alert('تم مزامنة نقاط الحضور بنجاح!');
  };

  const handleEndMarathon = () => {
    if (!activeMarathon || groupStats.length === 0) return;
    if (window.confirm('هل أنت متأكد من إنهاء الماراثون؟ سيتم تحديد الفائز بناءً على النقاط الحالية.')) {
      const winner = groupStats[0];
      const updated = { ...activeMarathon, active: false, winnerGroupId: winner.id };
      storageService.updateMarathon(updated);
      setActiveMarathon(updated);
    }
  };

  const renderDashboard = () => (
    <MarathonDashboard />
  );

  const renderPointsEntry = () => (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-2xl font-black text-slate-800 dark:text-white">تسجيل النقاط الأسبوعية</h3>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <Calendar size={20} className="text-blue-600 ml-2" />
          <input 
            type="date" 
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="bg-transparent border-none outline-none font-black text-sm text-slate-800 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {groups.filter(g => activeMarathon?.groupIds.includes(g.id)).map(group => (
          <div key={group.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="font-black text-slate-800 dark:text-white">{group.name}</h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <p className="text-[10px] text-slate-500 font-bold">الخادم: {group.servantName}</p>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <p className="text-[10px] text-blue-600 font-black">إجمالي الأسبوع: {
                    activityPoints
                      .filter(p => p.marathonId === activeMarathon?.id && group.youthIds.includes(p.youthId) && p.weekDate === selectedWeek)
                      .reduce((sum, p) => sum + p.points, 0)
                  } نقطة</p>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <p className="text-[10px] text-emerald-600 font-black">إجمالي الماراثون: {
                    activityPoints
                      .filter(p => p.marathonId === activeMarathon?.id && group.youthIds.includes(p.youthId))
                      .reduce((sum, p) => sum + p.points, 0)
                  } نقطة</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => generateMarathonWeeklyReport(group, activeMarathon, selectedWeek, youth, activityPoints, attendance)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                  title="تحميل تقرير الأسبوع"
                >
                  <FileText size={20} />
                </button>
                <button 
                  onClick={() => generateMarathonFinalReport(activeMarathon, group, youth, activityPoints)}
                  className="p-2 text-amber-600 hover:bg-amber-100 rounded-xl transition-all"
                  title="تحميل التقرير الختامي للمجموعة"
                >
                  <Trophy size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {youth.filter(y => group.youthIds.includes(y.id)).map(y => {
                  const yWeekPoints = activityPoints.filter(p => p.youthId === y.id && p.weekDate === selectedWeek);
                  const total = yWeekPoints.reduce((sum, p) => sum + p.points, 0);
                  
                  return (
                    <div key={y.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{y.name}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {yWeekPoints.map((p, pIdx) => (
                            <div key={pIdx} className="group/point relative">
                              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-[8px] font-black text-blue-600 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-800/50 flex items-center gap-1">
                                {p.activity === 'liturgy' && <Church size={8} />}
                                {p.activity === 'meeting' && <Users size={8} />}
                                {p.activity === 'confession' && <ShieldCheck size={8} />}
                                {p.activity === 'tasbeha' && <Music size={8} />}
                                {p.activity === 'communion' && <Wine size={8} />}
                                {p.activity === 'fasting' && <UtensilsCrossed size={8} />}
                                {p.activity === 'memorizationPart' && <Brain size={8} />}
                                {p.activity === 'exodusCompetition' && <Scroll size={8} />}
                                {p.activity === 'weeklyCompetition' && <Trophy size={8} />}
                                {p.points}
                              </span>
                              <div className="absolute bottom-full right-0 mb-2 hidden group-hover/point:block z-50 bg-slate-900 text-white text-[10px] p-2 rounded-lg whitespace-nowrap shadow-xl">
                                {p.reason || 'بدون سبب'}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={() => {
                            const targetGroupId = window.prompt('أدخل اسم المجموعة المراد النقل إليها:');
                            const targetGroup = groups.find(g => g.name === targetGroupId);
                            if (targetGroup) {
                              // Remove from current
                              storageService.updateMarathonGroup({
                                ...group,
                                youthIds: group.youthIds.filter(id => id !== y.id)
                              });
                              // Add to target
                              storageService.updateMarathonGroup({
                                ...targetGroup,
                                youthIds: [...targetGroup.youthIds, y.id]
                              });
                              alert(`تم نقل ${y.name} إلى ${targetGroup.name}`);
                            } else {
                              alert('المجموعة غير موجودة');
                            }
                          }}
                          className="text-[10px] text-blue-500 font-bold hover:underline text-right"
                        >
                          نقل لمجموعة أخرى
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-slate-400 font-black uppercase">النقاط</p>
                          <p className="font-black text-blue-600">{total}</p>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => {
                              const activity = 'liturgy';
                              const points = activeMarathon!.pointSystem[activity];
                              storageService.addMarathonActivityPoints({
                                marathonId: activeMarathon!.id,
                                youthId: y.id,
                                weekDate: selectedWeek,
                                activity,
                                points,
                                reason: 'حضور القداس الإلهي',
                                timestamp: Date.now()
                              });
                            }}
                            className={`p-2 rounded-xl transition-all ${yWeekPoints.some(p => p.activity === 'liturgy') ? 'bg-amber-600 text-white shadow-lg' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
                            title="قداس"
                          >
                            <Church size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              const activity = 'communion';
                              const points = activeMarathon!.pointSystem[activity];
                              storageService.addMarathonActivityPoints({
                                marathonId: activeMarathon!.id,
                                youthId: y.id,
                                weekDate: selectedWeek,
                                activity,
                                points,
                                reason: 'التناول من الأسرار المقدسة',
                                timestamp: Date.now()
                              });
                            }}
                            className={`p-2 rounded-xl transition-all ${yWeekPoints.some(p => p.activity === 'communion') ? 'bg-rose-600 text-white shadow-lg' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                            title="تناول"
                          >
                            <Wine size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              const activity = 'confession';
                              const points = activeMarathon!.pointSystem[activity];
                              storageService.addMarathonActivityPoints({
                                marathonId: activeMarathon!.id,
                                youthId: y.id,
                                weekDate: selectedWeek,
                                activity,
                                points,
                                reason: 'ممارسة سر الاعتراف',
                                timestamp: Date.now()
                              });
                            }}
                            className={`p-2 rounded-xl transition-all ${yWeekPoints.some(p => p.activity === 'confession') ? 'bg-blue-600 text-white shadow-lg' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                            title="اعتراف"
                          >
                            <ShieldCheck size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              const activity = 'bibleReading';
                              // @ts-ignore - bibleReading might be in pointSystem or use a default
                              const points = activeMarathon!.pointSystem['bibleReading'] || 10;
                              storageService.addMarathonActivityPoints({
                                marathonId: activeMarathon!.id,
                                youthId: y.id,
                                weekDate: selectedWeek,
                                activity: 'bibleReading' as any,
                                points,
                                reason: 'قراءة الكتاب المقدس',
                                timestamp: Date.now()
                              });
                            }}
                            className={`p-2 rounded-xl transition-all ${yWeekPoints.some(p => p.activity === 'bibleReading') ? 'bg-emerald-600 text-white shadow-lg' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                            title="إنجيل"
                          >
                            <BookOpen size={16} />
                          </button>
                          <button 
                            onClick={() => {
                              const activity = window.prompt('اختر النشاط:\n(weeklyCompetition, memorizationPart, exodusCompetition, fasting, tasbeha)');
                              if (activity && Object.keys(activeMarathon!.pointSystem).includes(activity)) {
                                const points = activeMarathon!.pointSystem[activity as keyof MarathonPointSystem];
                                const reason = window.prompt(`إضافة نقاط لـ ${y.name}\nالنشاط: ${activity}\nالنقاط: ${points}\nأدخل السبب:`, 'مشاركة متميزة');
                                if (reason !== null) {
                                  storageService.addMarathonActivityPoints({
                                    marathonId: activeMarathon!.id,
                                    youthId: y.id,
                                    weekDate: selectedWeek,
                                    activity: activity as keyof MarathonPointSystem,
                                    points,
                                    reason: reason || 'مشاركة متميزة',
                                    timestamp: Date.now()
                                  });
                                }
                              } else if (activity) {
                                alert('نشاط غير صالح');
                              }
                            }}
                            className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                            title="المزيد"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGroups = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-black text-slate-800 dark:text-white">إدارة المجموعات</h3>
        <button onClick={handleAddGroup} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all">
          <Plus size={20} /> إضافة مجموعة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {groups.filter(g => activeMarathon?.groupIds.includes(g.id)).map(group => (
          <div key={group.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              {editingGroup?.id === group.id ? (
                <div className="flex-1 space-y-3">
                  <input 
                    placeholder="اسم المجموعة"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none font-black"
                    value={editingGroup.name}
                    onChange={e => setEditingGroup({...editingGroup, name: e.target.value})}
                  />
                  <input 
                    placeholder="اسم الخادم"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none font-bold text-sm"
                    value={editingGroup.servantName}
                    onChange={e => setEditingGroup({...editingGroup, servantName: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdateGroup(editingGroup as MarathonGroup)} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl font-black flex items-center justify-center gap-2">
                      <Check size={18} /> حفظ التعديلات
                    </button>
                    <button onClick={() => setEditingGroup(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-black">
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-white text-lg">{group.name}</h4>
                    <p className="text-xs text-slate-500 font-bold">الخادم: {group.servantName}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingGroup(group)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit3 size={18} /></button>
                    <button onClick={() => {
                      if(window.confirm('هل أنت متأكد من حذف هذه المجموعة؟')) storageService.deleteMarathonGroup(group.id);
                    }} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-black text-slate-500 uppercase tracking-wider">أعضاء المجموعة ({group.youthIds.length})</span>
                </div>
                
                {/* Youth Search & Add */}
                <div className="relative mb-4">
                  <div className="relative">
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text"
                      placeholder="ابحث عن شاب لإضافته..."
                      className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm outline-none focus:border-blue-500 transition-all"
                      value={youthSearch}
                      onChange={e => setYouthSearch(e.target.value)}
                    />
                  </div>
                  
                  {youthSearch && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-20 max-h-48 overflow-y-auto p-2">
                      {youth
                        .filter(y => 
                          y.name.includes(youthSearch) || 
                          y.code.includes(youthSearch)
                        )
                        .filter(y => !group.youthIds.includes(y.id))
                        .slice(0, 5)
                        .map(y => (
                          <button 
                            key={y.id}
                            onClick={() => {
                              storageService.updateMarathonGroup({
                                ...group,
                                youthIds: [...group.youthIds, y.id]
                              });
                              setYouthSearch('');
                            }}
                            className="w-full flex items-center justify-between p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all text-right"
                          >
                            <div className="flex flex-col items-start">
                              <span className="font-bold text-slate-700 dark:text-slate-200">{y.name}</span>
                              <span className="text-[10px] text-slate-400 font-black">{y.code}</span>
                            </div>
                            <Plus size={16} className="text-blue-500" />
                          </button>
                        ))
                      }
                      {youth.filter(y => y.name.includes(youthSearch) && !group.youthIds.includes(y.id)).length === 0 && (
                        <p className="text-center py-4 text-xs text-slate-400 font-bold">لا يوجد نتائج</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {group.youthIds.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-50 dark:border-slate-800/50 rounded-2xl">
                    <Users size={24} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-xs text-slate-400 font-bold">لا يوجد أعضاء في هذه المجموعة</p>
                  </div>
                ) : (
                  group.youthIds.map(yId => {
                    const y = youth.find(item => item.id === yId);
                    return (
                      <div key={yId} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group/item">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{y?.name || 'مجهول'}</span>
                          <span className="text-[10px] text-slate-400 font-black">{y?.code}</span>
                        </div>
                        <button 
                          onClick={() => {
                            if(window.confirm(`هل تريد حذف ${y?.name} من المجموعة؟`)) {
                              storageService.updateMarathonGroup({
                                ...group,
                                youthIds: group.youthIds.filter(id => id !== yId)
                              });
                            }
                          }}
                          className="text-slate-300 hover:text-rose-500 p-2 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10">
      <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8">إعدادات الماراثون</h3>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اسم الماراثون</label>
          <input 
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-blue-500"
            value={activeMarathon?.name}
            onChange={e => setActiveMarathon(prev => prev ? {...prev, name: e.target.value} : null)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ البدء</label>
            <input 
              type="date"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
              value={activeMarathon?.startDate}
              onChange={e => setActiveMarathon(prev => prev ? {...prev, startDate: e.target.value} : null)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ الانتهاء</label>
            <input 
              type="date"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
              value={activeMarathon?.endDate}
              onChange={e => setActiveMarathon(prev => prev ? {...prev, endDate: e.target.value} : null)}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <h4 className="font-black text-slate-800 dark:text-white mb-4">تعديل نظام النقاط الأساسي</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(activeMarathon?.pointSystem || {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {key === 'confession' ? 'الاعتراف' : key === 'tasbeha' ? 'التسبيحة' : key === 'meeting' ? 'الاجتماع' : key === 'weeklyCompetition' ? 'المسابقة' : key === 'liturgy' ? 'القداس' : key === 'communion' ? 'التناول' : key === 'exodusCompetition' ? 'سفر الخروج' : key === 'memorizationPart' ? 'الحفظ' : 'الصوم'}
                </span>
                <input 
                  type="number"
                  className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-center font-black"
                  value={value}
                  onChange={e => {
                    const newPoints = { ...activeMarathon!.pointSystem, [key]: parseInt(e.target.value) || 0 };
                    setActiveMarathon({...activeMarathon!, pointSystem: newPoints});
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-between pt-8 gap-4">
          <div className="flex gap-3">
            <button onClick={handleEndMarathon} className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-600 hover:text-white transition-all">
              إنهاء الماراثون وتحديد الفائز
            </button>
            <button onClick={syncAttendancePoints} className="px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black hover:bg-blue-600 hover:text-white transition-all">
              تحديث النقاط من الحضور
            </button>
          </div>
          <button onClick={handleSaveMarathon} className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all">
            <Save size={20} /> حفظ الإعدادات
          </button>
        </div>
      </div>
    </div>
  );

  const renderCreateView = () => (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-10">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Trophy size={40} className="text-blue-600" />
        </div>
        <h3 className="text-3xl font-black text-slate-800 dark:text-white">إنشاء ماراثون جديد</h3>
        <p className="text-slate-500 font-bold mt-2">أدخل تفاصيل الماراثون لبدء المنافسة</p>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">اسم الماراثون</label>
          <input 
            type="text"
            placeholder="مثال: ماراثون الصوم الكبير 2026"
            className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 outline-none focus:border-blue-500 text-xl font-black transition-all"
            value={newMarathonData.name}
            onChange={e => setNewMarathonData({...newMarathonData, name: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">تاريخ البدء (2026)</label>
            <div className="flex gap-2">
              <select 
                className="w-1/2 px-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center font-black outline-none focus:border-blue-500 appearance-none"
                value={newMarathonData.startDay}
                onChange={e => setNewMarathonData({...newMarathonData, startDay: e.target.value})}
              >
                <option value="">يوم</option>
                {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select 
                className="w-1/2 px-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center font-black outline-none focus:border-blue-500 appearance-none"
                value={newMarathonData.startMonth}
                onChange={e => setNewMarathonData({...newMarathonData, startMonth: e.target.value})}
              >
                <option value="">شهر</option>
                {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">تاريخ الانتهاء (2026)</label>
            <div className="flex gap-2">
              <select 
                className="w-1/2 px-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center font-black outline-none focus:border-blue-500 appearance-none"
                value={newMarathonData.endDay}
                onChange={e => setNewMarathonData({...newMarathonData, endDay: e.target.value})}
              >
                <option value="">يوم</option>
                {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select 
                className="w-1/2 px-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center font-black outline-none focus:border-blue-500 appearance-none"
                value={newMarathonData.endMonth}
                onChange={e => setNewMarathonData({...newMarathonData, endMonth: e.target.value})}
              >
                <option value="">شهر</option>
                {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <button 
            onClick={handleConfirmCreate}
            className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-xl shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
          >
            <Check size={24} /> تأكيد وإنشاء الماراثون
          </button>
          <button 
            onClick={() => setView('list')}
            className="w-full mt-4 py-4 text-slate-400 font-bold hover:text-slate-600 transition-all"
          >
            إلغاء والعودة
          </button>
        </div>
      </div>
    </div>
  );

  if (marathons.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4 font-['Cairo']">
        {renderCreateView()}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 font-['Cairo']">
      {/* Marathon Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[3rem] p-10 text-white mb-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">ماراثون 2026</span>
              {!activeMarathon?.active && <span className="px-3 py-1 bg-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest">منتهي</span>}
            </div>
            <h2 className="text-5xl font-black mb-4">{activeMarathon?.name}</h2>
            <div className="flex items-center gap-6 text-blue-100 font-bold">
              <div className="flex items-center gap-2"><Calendar size={18} /> {activeMarathon?.startDate} — {activeMarathon?.endDate}</div>
              <div className="flex items-center gap-2"><Users size={18} /> {groups.filter(g => activeMarathon?.groupIds.includes(g.id)).length} مجموعة</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView('list')} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all" title="قائمة الماراثونات">
              <Settings size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-4 mb-10">
        <TabButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={TrendingUp} label="لوحة التحكم" />
        <TabButton active={view === 'groups'} onClick={() => setView('groups')} icon={Users} label="المجموعات" />
        <TabButton active={view === 'points'} onClick={() => setView('points')} icon={Star} label="تسجيل النقاط" />
        <TabButton active={view === 'settings'} onClick={() => setView('settings')} icon={Settings} label="الإعدادات" />
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'dashboard' && renderDashboard()}
          {view === 'groups' && renderGroups()}
          {view === 'points' && renderPointsEntry()}
          {view === 'settings' && renderSettings()}
          {view === 'create' && renderCreateView()}
          {view === 'list' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-slate-800">تاريخ الماراثونات</h3>
                <button onClick={handleCreateMarathon} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg">إنشاء جديد</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {marathons.map(m => (
                  <div key={m.id} onClick={() => { setActiveMarathon(m); setView('dashboard'); }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm cursor-pointer hover:border-blue-500 transition-all">
                    <h4 className="text-xl font-black text-slate-800 mb-2">{m.name}</h4>
                    <p className="text-sm text-slate-500 font-bold">{m.startDate} — {m.endDate}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black ${m.active ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                        {m.active ? 'نشط حالياً' : 'مكتمل'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/40 translate-y-[-2px]' 
        : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
    }`}
  >
    <Icon size={20} />
    {label}
  </button>
);
