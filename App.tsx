
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { AddYouth } from './pages/AddYouth';
import { EditYouth } from './pages/EditYouth';
import { RegisterAttendance } from './pages/RegisterAttendance';
import { YouthList } from './pages/YouthList';
import { AllAttendance } from './components/AllAttendance';
import { Settings } from './pages/Settings';
import { YouthProfile } from './pages/YouthProfile';
import { YouthPortal } from './pages/YouthPortal';
import { Login } from './pages/Login';
import { storageService } from './services/storageService';
import { Loader2, Cpu, Database, ShieldCheck, Wifi } from 'lucide-react';

const RouteManager = ({ 
  isAuthenticated, 
  onLoginSuccess, 
  handleLogout
}: { 
  isAuthenticated: boolean, 
  onLoginSuccess: () => void, 
  handleLogout: () => void
}) => {
  const location = useLocation();
  const isProfilePage = location.pathname.startsWith('/youth-profile/');
  const isPortalPage = location.pathname === '/youth-portal';

  if (!isAuthenticated) {
    if (isProfilePage || isPortalPage) {
      return (
        <Layout onLogout={handleLogout} hideSidebar={true}>
          <Routes>
            <Route path="/youth-profile/:id" element={<YouthProfile onLogout={handleLogout} />} />
            <Route path="/youth-portal" element={<YouthPortal />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      );
    }
    return <Login onLoginSuccess={onLoginSuccess} />;
  }

  return (
    <Layout onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add-youth" element={<AddYouth />} />
        <Route path="/edit-youth/:id" element={<EditYouth />} />
        <Route path="/register-attendance" element={<RegisterAttendance />} />
        <Route path="/youth-portal" element={<YouthPortal />} />
        <Route path="/all-attendance" element={<AllAttendance />} />
        <Route path="/youth-list" element={<YouthList />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/youth-profile/:id" element={<YouthProfile onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const SyncIndicator = () => {
  const [status, setStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  
  useEffect(() => {
    const start = () => setStatus('syncing');
    const end = () => setStatus('synced');
    const err = () => setStatus('error');
    
    window.addEventListener('sync_started', start);
    window.addEventListener('sync_ended', end);
    window.addEventListener('sync_error', err);
    
    return () => {
      window.removeEventListener('sync_started', start);
      window.removeEventListener('sync_ended', end);
      window.removeEventListener('sync_error', err);
    };
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md shadow-2xl transition-all duration-500 ${
        status === 'syncing' ? 'bg-blue-600/90 border-blue-400 text-white animate-pulse' :
        status === 'error' ? 'bg-rose-600/90 border-rose-400 text-white' :
        'bg-slate-900/80 border-white/10 text-slate-300'
      }`}>
        {status === 'syncing' ? <Loader2 size={14} className="animate-spin" /> : 
         status === 'error' ? <Wifi size={14} /> : <Database size={14} />}
        <span className="text-[10px] font-black uppercase tracking-widest">
          {status === 'syncing' ? 'مزامنة سحابية...' : status === 'error' ? 'خطأ في الاتصال' : 'النظام متصل وآمن'}
        </span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0); 
  const [statusMsg, setStatusMsg] = useState('بدء تهيئة النظام...');

  useEffect(() => {
    const duration = 15000; 
    const interval = 50;
    const steps = duration / interval;
    let currentStepCount = 0;

    const messages = [
      { p: 15, m: "تفعيل بروتوكول الأمان..." },
      { p: 40, m: "مزامنة السجلات السحابية..." },
      { p: 70, m: "تحميل بيانات كنيسة الملاك..." },
      { p: 90, m: "تجهيز لوحة الخدام..." },
      { p: 100, m: "نظام الملاك روفائيل جاهز." }
    ];

    const timer = setInterval(() => {
      currentStepCount++;
      const currentProgress = (currentStepCount / steps) * 100;
      setProgress(currentProgress);

      if (currentProgress < 33) setActiveStep(0);
      else if (currentProgress < 66) setActiveStep(1);
      else setActiveStep(2);

      const msg = messages.find(item => currentProgress <= item.p);
      if (msg) setStatusMsg(msg.m);

      if (currentStepCount >= steps) {
        clearInterval(timer);
        storageService.syncFromCloud(true).finally(() => {
          setIsAuthenticated(storageService.isLoggedIn());
          setIsChecking(false);
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    storageService.logout();
    setIsAuthenticated(false);
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-between font-['Cairo'] text-white p-10 relative overflow-hidden">
        {/* Deep Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        {/* Header - Balanced Medium Fonts */}
        <div className="relative z-10 text-center space-y-1">
           <h2 className="text-xl md:text-2xl font-black text-slate-300 tracking-wide">كنيسة الملاك روفائيل</h2>
           <h1 className="text-lg md:text-xl font-bold text-blue-500 uppercase tracking-widest">اجتماع ثانوي بنين</h1>
        </div>

        {/* Main Transparent Square (Glassmorphism) */}
        <div className="relative z-10 w-full max-w-sm p-10 rounded-[3rem] bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.6)] flex flex-col items-center gap-10">
          
          {/* 1. Large Loader (Top of Square) */}
          <div className="relative flex items-center justify-center">
             <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse"></div>
             <div className="w-24 h-24 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin"></div>
             <Loader2 size={36} className="absolute text-blue-400 animate-spin-slow" />
          </div>

          {/* 2. Progress Section (Middle of Square) */}
          <div className="w-full space-y-4">
             <div className="flex justify-between items-end mb-1">
                <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-wider">
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-ping"></div>
                  {statusMsg}
                </div>
                <div className="text-2xl font-black text-white">{Math.round(progress)}%</div>
             </div>
             
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-blue-700 via-blue-400 to-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
             </div>
          </div>

          {/* 3. Icons with Light Cycle (Bottom of Square) */}
          <div className="flex items-center justify-center gap-8 w-full">
             {/* Security - Active 0-5s */}
             <div className="flex flex-col items-center gap-1.5 transition-all duration-700">
                <div className={`p-3 rounded-2xl border ${activeStep === 0 ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-110' : 'bg-white/5 border-white/5 text-slate-700 opacity-30 scale-95'}`}>
                  <ShieldCheck size={22} />
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${activeStep === 0 ? 'text-blue-400' : 'text-slate-700'}`}>أمان</span>
             </div>
             
             {/* CPU - Active 5-10s */}
             <div className="flex flex-col items-center gap-1.5 transition-all duration-700">
                <div className={`p-3 rounded-2xl border ${activeStep === 1 ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-110' : 'bg-white/5 border-white/5 text-slate-700 opacity-30 scale-95'}`}>
                  <Cpu size={22} className={activeStep === 1 ? 'animate-pulse' : ''} />
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${activeStep === 1 ? 'text-indigo-400' : 'text-slate-700'}`}>معالجة</span>
             </div>

             {/* Database - Active 10-15s */}
             <div className="flex flex-col items-center gap-1.5 transition-all duration-700">
                <div className={`p-3 rounded-2xl border ${activeStep === 2 ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-110' : 'bg-white/5 border-white/5 text-slate-700 opacity-30 scale-95'}`}>
                  <Database size={22} />
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${activeStep === 2 ? 'text-emerald-400' : 'text-slate-700'}`}>بيانات</span>
             </div>
          </div>
        </div>

        {/* Footer Signature */}
        <div className="relative z-10 text-center">
           <p className="text-md font-black text-slate-400">
             مطور بواسطة: <span className="text-blue-500">كيرلس صفوت</span>
           </p>
           <p className="text-[7px] font-bold text-slate-600 uppercase tracking-[0.4em] mt-1 opacity-60">Angel Raphael Digital Systems</p>
        </div>

        <style>{`
          .animate-spin-slow { animation: spin 3s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <HashRouter>
      <RouteManager 
        isAuthenticated={isAuthenticated} 
        onLoginSuccess={() => setIsAuthenticated(true)} 
        handleLogout={handleLogout} 
      />
      <SyncIndicator />
    </HashRouter>
  );
};

export default App;
