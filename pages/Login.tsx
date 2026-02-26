
import { ShieldCheck, Lock, AlertCircle, Loader2, Users, Hash, Search, ArrowRight, Sparkles, CheckCircle2, Code, Info, UserCheck, Instagram } from 'lucide-react';
import { storageService } from '../services/storageService';
import React, { useState } from 'react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'special' | 'servant' | 'youth'>('admin');
  const [password, setPassword] = useState('');
  const [specialPassword, setSpecialPassword] = useState('');
  const [youthCode, setYouthCode] = useState('');
  const [servantCode, setServantCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const config = storageService.getConfig();

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    await new Promise(r => setTimeout(r, 1000));

    if (password === config.adminPassword) {
      setSuccess(true);
      storageService.setLoggedIn(true, false);
      setTimeout(() => {
        onLoginSuccess();
      }, 800);
    } else {
      setError('كلمة السر غير صحيحة.. حاول مرة أخرى');
      setLoading(false);
    }
  };

  const handleSpecialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    await new Promise(r => setTimeout(r, 1000));

    if (specialPassword === 'Mina##') {
      setSuccess(true);
      storageService.setLoggedIn(true, true);
      setTimeout(() => {
        window.location.hash = '/special-follow-up';
        onLoginSuccess();
      }, 800);
    } else {
      setError('كلمة السر غير صحيحة.. حاول مرة أخرى');
      setLoading(false);
    }
  };

  const handleServantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (servantCode.length < 5) return;
    
    setLoading(true);
    setError(null);

    setTimeout(() => {
      const allServants = storageService.getServants();
      const found = allServants.find(s => s.code === servantCode);
      
      if (found) {
        setSuccess(true);
        setTimeout(() => {
          window.location.hash = `/servant-profile/${found.id}`;
        }, 800);
      } else {
        setError('كود الخادم غير موجود في السجلات');
        setLoading(false);
      }
    }, 800);
  };

  const handleYouthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (youthCode.length < 5) return;
    
    setLoading(true);
    setError(null);

    setTimeout(() => {
      const allYouth = storageService.getYouth();
      const found = allYouth.find(y => y.code === youthCode);
      
      if (found) {
        setSuccess(true);
        setTimeout(() => {
          window.location.hash = `/youth-profile/${found.id}`;
        }, 800);
      } else {
        setError('كود الشاب غير موجود في السجلات');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-['Cairo'] bg-[#020617]">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
      
      <div className="relative z-10 w-full max-w-[440px] p-6">
        <div className={`bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden transition-all duration-500 ${success ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
          
          <div className="text-center pt-12 pb-6">
            <div className={`w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white shadow-2xl transition-all duration-700 ${activeTab === 'admin' ? 'bg-gradient-to-br from-slate-700 to-slate-900 rotate-6' : activeTab === 'special' ? 'bg-gradient-to-br from-amber-500 to-amber-700 rotate-12' : activeTab === 'servant' ? 'bg-gradient-to-br from-rose-500 to-rose-700 rotate-0' : 'bg-gradient-to-br from-blue-500 to-indigo-700 -rotate-6'}`}>
              {activeTab === 'admin' ? <ShieldCheck size={40} /> : activeTab === 'special' ? <Lock size={40} /> : activeTab === 'servant' ? <UserCheck size={40} /> : <Users size={40} />}
            </div>
            <h1 className="text-2xl font-black text-white px-4">
              اجتماع ثانوي بنين <br/>
              <span className="text-blue-400 text-lg">{config.churchName}</span>
            </h1>
          </div>

          <div className="px-4 pb-6">
            <div className="grid grid-cols-2 gap-2 bg-white/5 p-2 rounded-3xl border border-white/5">
              <button 
                onClick={() => { setActiveTab('admin'); setError(null); }}
                className={`py-4 rounded-2xl font-black text-xs transition-all leading-tight ${activeTab === 'admin' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                بوابة متابعة <br/> شباب الاجتماع
              </button>
              <button 
                onClick={() => { setActiveTab('special'); setError(null); }}
                className={`py-4 rounded-2xl font-black text-xs transition-all leading-tight ${activeTab === 'special' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                متابعة <br/> خاصة
              </button>
              <button 
                onClick={() => { setActiveTab('servant'); setError(null); }}
                className={`py-4 rounded-2xl font-black text-xs transition-all leading-tight ${activeTab === 'servant' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                بوابة <br/> الخدام
              </button>
              <button 
                onClick={() => { setActiveTab('youth'); setError(null); }}
                className={`py-4 rounded-2xl font-black text-xs transition-all leading-tight ${activeTab === 'youth' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                بوابة <br/> الشباب
              </button>
            </div>
          </div>

          <div className="px-8 pb-10">
            {activeTab === 'admin' ? (
              <form onSubmit={handleAdminSubmit} className="space-y-5">
                <div className="space-y-2 text-right">
                  <label className="text-[10px] font-black text-slate-500 mr-2 uppercase tracking-widest">كلمة مرور بوابة متابعة شباب الاجتماع</label>
                  <div className="relative">
                    <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-6 text-white text-center font-black tracking-widest outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-white/10 hover:bg-white/20 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" /> : <><span>دخول البوابة</span><ArrowRight size={18} /></>}
                </button>
              </form>
            ) : activeTab === 'special' ? (
              <form onSubmit={handleSpecialSubmit} className="space-y-5">
                <div className="space-y-2 text-right">
                  <label className="text-[10px] font-black text-slate-500 mr-2 uppercase tracking-widest">كلمة مرور المتابعة الخاصة</label>
                  <div className="relative">
                    <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-6 text-white text-center font-black tracking-widest outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                      value={specialPassword}
                      onChange={(e) => setSpecialPassword(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-900/40 disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" /> : <><span>دخول المتابعة الخاصة</span><ArrowRight size={18} /></>}
                </button>
              </form>
            ) : activeTab === 'servant' ? (
              <form onSubmit={handleServantSubmit} className="space-y-5">
                <div className="space-y-2 text-right">
                  <label className="text-[10px] font-black text-slate-500 mr-2 uppercase tracking-widest">أدخل كود الخادم (٥ أرقام)</label>
                  <div className="relative">
                    <Hash className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={5}
                      placeholder="00000"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pr-14 pl-6 text-white text-center font-black tracking-[0.3em] text-3xl outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                      value={servantCode}
                      onChange={(e) => setServantCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading || servantCode.length < 5} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-rose-900/40 disabled:opacity-30">
                  {loading ? <Loader2 className="animate-spin" /> : <><span>عرض ملفي</span><Search size={20} /></>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleYouthSubmit} className="space-y-5">
                <div className="space-y-2 text-right">
                  <label className="text-[10px] font-black text-slate-500 mr-2 uppercase tracking-widest">أدخل كودك المكون من ٥ أرقام</label>
                  <div className="relative">
                    <Hash className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={5}
                      placeholder="00000"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pr-14 pl-6 text-white text-center font-black tracking-[0.3em] text-3xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={youthCode}
                      onChange={(e) => setYouthCode(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading || youthCode.length < 5} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/40 disabled:opacity-30">
                  {loading ? <Loader2 className="animate-spin" /> : <><span>عرض ملفي</span><Search size={20} /></>}
                </button>
              </form>
            )}

            {error && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs font-bold text-center">
                {error}
              </div>
            )}
          </div>

          <div className="bg-white/[0.02] py-6 px-8 text-center border-t border-white/5">
            <p className="text-base font-black text-blue-400 flex items-center justify-center gap-2" dir="ltr">
              <span>Developer by:</span>
              <a href="https://www.instagram.com/kero_sfwat?igsh=MW13OWg0bXE2emJmYg%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-white font-black hover:text-blue-400 transition-colors flex items-center gap-1.5">
                <span>kerolos sfwat</span>
                <Instagram size={18} className="text-pink-500" />
              </a>
            </p>
          </div>
        </div>

        {success && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in">
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl mb-4">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-xl font-black text-white">تم التحقق</h2>
            <p className="text-emerald-400 text-sm font-bold">جاري فتح النظام...</p>
          </div>
        )}
      </div>
    </div>
  );
};
