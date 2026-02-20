
import { ShieldCheck, Lock, AlertCircle, Loader2, Users, Hash, Search, ArrowRight, Sparkles, CheckCircle2, Code, Info } from 'lucide-react';
import { storageService } from '../services/storageService';
import React, { useState } from 'react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  // جعل "بوابة الخدام" هي الافتراضية كما طلب المستخدم
  const [activeTab, setActiveTab] = useState<'admin' | 'youth'>('admin');
  const [password, setPassword] = useState('');
  const [youthCode, setYouthCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const config = storageService.getConfig();

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // محاكاة تأمين الاتصال
    await new Promise(r => setTimeout(r, 1000));

    if (password === config.adminPassword) {
      setSuccess(true);
      storageService.setLoggedIn(true);
      setTimeout(() => {
        onLoginSuccess();
      }, 800);
    } else {
      setError('كلمة السر غير صحيحة.. حاول مرة أخرى');
      setLoading(false);
    }
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
            <div className={`w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white shadow-2xl transition-all duration-700 ${activeTab === 'admin' ? 'bg-gradient-to-br from-slate-700 to-slate-900 rotate-6' : 'bg-gradient-to-br from-blue-500 to-indigo-700 -rotate-6'}`}>
              {activeTab === 'admin' ? <ShieldCheck size={40} /> : <Users size={40} />}
            </div>
            <h1 className="text-2xl font-black text-white px-4">
              اجتماع ثانوي بنين <br/>
              <span className="text-blue-400 text-lg">{config.churchName}</span>
            </h1>
          </div>

          <div className="px-8 pb-6">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
              <button 
                onClick={() => { setActiveTab('admin'); setError(null); }}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'admin' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                بوابة الخدام
              </button>
              <button 
                onClick={() => { setActiveTab('youth'); setError(null); }}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'youth' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                بوابة الشباب
              </button>
            </div>
          </div>

          <div className="px-8 pb-10">
            {activeTab === 'admin' ? (
              <form onSubmit={handleAdminSubmit} className="space-y-5">
                <div className="space-y-2 text-right">
                  <label className="text-[10px] font-black text-slate-500 mr-2 uppercase tracking-widest">كلمة مرور النظام</label>
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
                  {loading ? <Loader2 className="animate-spin" /> : <><span>دخول الإدارة</span><ArrowRight size={18} /></>}
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
            <p className="text-[11px] font-black text-blue-400 flex items-center justify-center gap-2">
              <Code size={14} /> مطور بواسطة: <span className="text-white font-black underline decoration-blue-500">كيرلس صفوت</span>
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
