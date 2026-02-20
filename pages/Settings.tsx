
import React, { useState, useEffect } from 'react';
import { 
  Trash2, Database, ShieldCheck, Settings as SettingsIcon, 
  Layout, Users, Lock, Save, Plus, X, Cloud, RefreshCw, 
  AlertTriangle, Eraser, Download, CheckCircle2, Loader2, Info, Skull
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { SystemConfig } from '../types';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'grades' | 'security' | 'danger'>('general');
  const [config, setConfig] = useState<SystemConfig>(storageService.getConfig());
  const [isSaving, setIsSaving] = useState(false);
  const [newGrade, setNewGrade] = useState('');
  const [status, setStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const showStatus = (msg: string, type: 'success' | 'error' = 'success') => {
    setStatus({ msg, type });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    const success = await storageService.saveConfig(config);
    setIsSaving(false);
    if (success) showStatus('تم حفظ الإعدادات ومزامنتها');
    else showStatus('فشل الرفع للسحاب، جرب لاحقاً', 'error');
  };

  const addGrade = () => {
    if (newGrade && !config.grades.includes(newGrade)) {
      setConfig({ ...config, grades: [...config.grades, newGrade] });
      setNewGrade('');
    }
  };

  const removeGrade = (grade: string) => {
    setConfig({ ...config, grades: config.grades.filter(g => g !== grade) });
  };

  // عمليات الحذف الكلي (الجديدة)
  const handleWipeAttendance = async () => {
    if (window.confirm('⚠️ مسح سجل الحضور بالكامل؟\n\nسيتم حذف كافة سجلات الغياب والحضور السابقة نهائياً من الجهاز والسحابة. لا يمكن التراجع!')) {
      setIsSaving(true);
      const success = await storageService.wipeAllAttendance();
      setIsSaving(false);
      if (success) showStatus('تم تصفير الأرشيف بنجاح');
      else showStatus('حدث خطأ في المزامنة', 'error');
    }
  };

  const handleWipeYouth = async () => {
    if (window.confirm('⚠️ حذف كافة أسماء الشباب؟\n\nسيتم مسح قائمة الشباب تماماً مع كافة سجلاتهم. سيصبح النظام فارغاً.')) {
      setIsSaving(true);
      const success = await storageService.wipeAllYouth();
      setIsSaving(false);
      if (success) showStatus('تم حذف جميع الشباب بنجاح');
      else showStatus('حدث خطأ في المزامنة', 'error');
    }
  };

  const handleFactoryReset = async () => {
    const code = Math.floor(1000 + Math.random() * 9000);
    const input = window.prompt(`🛑 تصفير المصنع النهائي!\n\nسيتم مسح (الشباب + الحضور + الإعدادات) من هنا ومن السحابة.\nأدخل هذا الكود للتأكيد: ${code}`);
    
    if (input === code.toString()) {
      setIsSaving(true);
      await storageService.factoryReset();
    } else if (input !== null) {
      alert('الكود خطأ.. تم إلغاء العملية');
    }
  };

  const handleForceSync = async () => {
    setIsSaving(true);
    const res = await storageService.syncFromCloud(true);
    setIsSaving(false);
    if (res.success) showStatus('تم تحديث البيانات من السحابة');
    else showStatus('فشل جلب البيانات من السحاب', 'error');
  };

  const TabBtn = ({ id, label, icon: Icon, color }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-sm transition-all border ${
        activeTab === id 
          ? `bg-${color}-600 text-white border-transparent shadow-lg scale-105` 
          : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto pb-24 font-['Cairo']">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-800 flex items-center gap-3">
             <SettingsIcon size={32} className="text-blue-600" /> لوحة الإدارة والبيانات
          </h2>
          <p className="text-slate-500 font-bold mt-1">تحكم في إعدادات النظام وقاعدة البيانات السحابية.</p>
        </div>
        {status && (
          <div className={`px-6 py-3 rounded-2xl border-2 font-black text-sm animate-bounce flex items-center gap-3 shadow-xl ${
            status.type === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          }`}>
            <CheckCircle2 size={18} /> {status.msg}
          </div>
        )}
      </header>

      <div className="flex flex-wrap gap-3 mb-8">
        <TabBtn id="general" label="إعدادات الاجتماع" icon={Layout} color="blue" />
        <TabBtn id="grades" label="المراحل الدراسية" icon={Users} color="indigo" />
        <TabBtn id="security" label="كلمة السر" icon={Lock} color="slate" />
        <TabBtn id="danger" label="منطقة الخطر" icon={AlertTriangle} color="rose" />
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 md:p-12">
          {activeTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
              <div className="space-y-3">
                <label className="block text-sm font-black text-slate-700">اسم الكنيسة</label>
                <input type="text" className="w-full px-6 py-4 rounded-2xl border border-slate-200 font-bold focus:ring-4 focus:ring-blue-50" value={config.churchName} onChange={e => setConfig({...config, churchName: e.target.value})} />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-black text-slate-700">اسم الاجتماع</label>
                <input type="text" className="w-full px-6 py-4 rounded-2xl border border-slate-200 font-bold focus:ring-4 focus:ring-blue-50" value={config.meetingName} onChange={e => setConfig({...config, meetingName: e.target.value})} />
              </div>
            </div>
          )}

          {activeTab === 'grades' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="اسم المرحلة الجديدة..." 
                  className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 font-bold" 
                  value={newGrade} 
                  onChange={e => setNewGrade(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addGrade()}
                />
                <button onClick={addGrade} className="bg-indigo-600 text-white px-8 rounded-2xl font-black hover:bg-indigo-700 transition-colors">إضافة</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {config.grades.map(grade => (
                  <div key={grade} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <span className="font-black text-slate-700">{grade}</span>
                    <button onClick={() => removeGrade(grade)} className="text-slate-300 hover:text-rose-600 p-2 transition-colors opacity-0 group-hover:opacity-100">
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-md animate-in fade-in duration-500">
              <div className="space-y-3">
                <label className="block text-sm font-black text-slate-700">كلمة سر الدخول للخدام</label>
                <div className="relative">
                  <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input type="password" placeholder="أدخل كلمة السر الجديدة" className="w-full px-6 py-5 pr-14 rounded-2xl border border-slate-200 font-black tracking-widest text-xl" value={config.adminPassword} onChange={e => setConfig({...config, adminPassword: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-amber-50 p-8 rounded-[2rem] border border-amber-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-amber-600 text-white rounded-2xl shadow-lg">
                    <Cloud size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-amber-900">المزامنة القسرية</h4>
                    <p className="text-sm text-amber-700 font-bold">لحل مشاكل عدم ظهور البيانات أو الحذف.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={handleForceSync} className="flex items-center justify-center gap-3 px-6 py-5 bg-white border-2 border-amber-200 text-amber-700 rounded-2xl font-black hover:bg-amber-600 hover:text-white transition-all">
                    <RefreshCw size={20} /> جلب البيانات من السحاب الآن
                  </button>
                  <button onClick={() => storageService.pushToCloud().then(s => s ? showStatus('تم الرفع') : showStatus('فشل الرفع','error'))} className="flex items-center justify-center gap-3 px-6 py-5 bg-white border-2 border-blue-200 text-blue-700 rounded-2xl font-black hover:bg-blue-600 hover:text-white transition-all">
                    <Cloud size={20} /> رفع البيانات الحالية فوراً
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100">
                  <h4 className="font-black text-xl text-rose-900 mb-2 flex items-center gap-2"><RefreshCw size={20}/> بدء موسم جديد</h4>
                  <p className="text-sm text-rose-700 font-bold mb-6">سيتم تصفير كافة السجلات والبدء من تاريخ اليوم الفعلي.</p>
                  <button onClick={handleFactoryReset} className="w-full py-4 bg-white border-2 border-rose-300 text-rose-600 rounded-2xl font-black hover:bg-rose-600 hover:text-white transition-all">
                    بدء الموسم الآن
                  </button>
                </div>

                <div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100">
                  <h4 className="font-black text-xl text-rose-900 mb-2 flex items-center gap-2"><Eraser size={20}/> تصفير سجل الحضور</h4>
                  <p className="text-sm text-rose-700 font-bold mb-6">يمسح كل أيام الحضور السابقة ويترك أسماء الشباب.</p>
                  <button onClick={handleWipeAttendance} className="w-full py-4 bg-white border-2 border-rose-300 text-rose-600 rounded-2xl font-black hover:bg-rose-600 hover:text-white transition-all">
                    مسح السجل التاريخي
                  </button>
                </div>

                <div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100">
                  <h4 className="font-black text-xl text-rose-900 mb-2 flex items-center gap-2"><Users size={20}/> مسح قائمة الشباب</h4>
                  <p className="text-sm text-rose-700 font-bold mb-6">يمسح كل الشباب وسجلاتهم تماماً من النظام.</p>
                  <button onClick={handleWipeYouth} className="w-full py-4 bg-white border-2 border-rose-300 text-rose-600 rounded-2xl font-black hover:bg-rose-600 hover:text-white transition-all">
                    حذف جميع الشباب
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform"></div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="text-center md:text-right">
                    <h4 className="font-black text-2xl text-white mb-2 flex items-center justify-center md:justify-start gap-3"><Skull size={28} className="text-rose-500" /> تصفير المصنع</h4>
                    <p className="text-slate-400 font-bold">هذا الإجراء سيمحو كل شيء تماماً ويعيد النظام كما كان أول مرة.</p>
                  </div>
                  <button onClick={handleFactoryReset} className="px-10 py-5 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/40">
                    إبادة شاملة للبيانات
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 md:p-12 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={handleSaveConfig} 
            disabled={isSaving} 
            className="flex items-center gap-3 bg-blue-600 text-white px-12 py-5 rounded-[2rem] font-black shadow-xl shadow-blue-200 hover:scale-105 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
            حفظ إعدادات النظام
          </button>
        </div>
      </div>
    </div>
  );
};
