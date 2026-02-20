
import React, { useState } from 'react';
import { Hash, Search, Loader2, AlertCircle, Users, Sparkles, UserCheck, ArrowRight, ShieldCheck, Code, Delete, CheckCircle2 } from 'lucide-react';
import { storageService } from '../services/storageService';
/* Fix: Use double quotes for react-router-dom imports */
import { useNavigate } from "react-router-dom";

export const YouthPortal: React.FC = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.length < 5) return;

    setLoading(true);
    setError(false);

    setTimeout(() => {
      const allYouth = storageService.getYouth();
      const found = allYouth.find(y => y.code === code);

      if (found) {
        // توجيه لبروفايل الشاب
        navigate(`/youth-profile/${found.id}`);
        setCode('');
        setLoading(false);
      } else {
        setError(true);
        setLoading(false);
        // مسح الكود عند الخطأ ليعيد الشاب المحاولة
        setTimeout(() => {
          setError(false);
          setCode('');
        }, 2000);
      }
    }, 600);
  };

  const handleNumberClick = (num: string) => {
    if (code.length < 5) {
      setCode(prev => prev + num);
    }
  };

  // وظيفة الحذف (حذف رقم واحد)
  const handleBackspace = () => {
    setCode(prev => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-10 font-['Cairo']">
      {/* زر عودة محمي للخادم فقط */}
      <div className="max-w-2xl mx-auto w-full mb-6">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-sm transition-all group"
        >
          <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />
          <span>العودة للوحة التحكم (خاص بالخادم)</span>
        </button>
      </div>

      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-blue-100/50 border border-slate-100 overflow-hidden mb-8">
          <div className="bg-blue-600 p-10 text-center text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-[5rem]"></div>
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Users size={40} />
            </div>
            <h2 className="text-3xl font-black mb-2">بوابة دخول الشباب</h2>
            <p className="text-blue-100 font-bold opacity-80 uppercase tracking-widest text-xs">كنيسة رئيس الملائكة روفائيل</p>
          </div>

          <div className="p-8 md:p-12 space-y-10">
            <div className="space-y-6">
              <div className="relative">
                <Hash className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={32} />
                <div className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-8 pr-20 pl-6 text-center text-5xl font-black tracking-[0.4em] text-blue-600 shadow-inner min-h-[110px] flex items-center justify-center">
                  {code || <span className="text-slate-200 tracking-normal text-3xl">أدخل كودك</span>}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center gap-3 text-red-600 font-black animate-shake">
                  <AlertCircle size={20} />
                  <span>عذراً.. هذا الكود غير مسجل عندنا!</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumberClick(num.toString())}
                    className="h-24 bg-white border border-slate-200 rounded-2xl text-3xl font-black text-slate-700 hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-90 shadow-sm flex items-center justify-center"
                  >
                    {num}
                  </button>
                ))}
                
                {/* زر التأكيد (اليمين في RTL) */}
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={code.length < 5 || loading}
                  className="h-24 bg-emerald-600 text-white rounded-2xl text-xl font-black hover:bg-emerald-700 transition-all active:scale-90 shadow-lg shadow-emerald-100 flex flex-col items-center justify-center gap-1 disabled:opacity-30"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={28} />}
                  <span className="text-[10px] uppercase">تأكيد</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNumberClick('0')}
                  className="h-24 bg-white border border-slate-200 rounded-2xl text-3xl font-black text-slate-700 hover:bg-blue-50 transition-all active:scale-90 shadow-sm flex items-center justify-center"
                >
                  0
                </button>

                {/* زر الحذف (اليسار في RTL) */}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-24 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-xl font-black hover:bg-rose-100 transition-all active:scale-90 flex flex-col items-center justify-center gap-1"
                >
                  <Delete size={28} />
                  <span className="text-[10px] uppercase">مسح</span>
                </button>
              </div>
            </div>

            <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 text-center relative overflow-hidden">
              <Sparkles className="absolute top-2 right-2 text-blue-200" size={16} />
              <p className="text-blue-700 font-bold text-sm relative z-10">
                يا بطل.. أدخل الـ 5 أرقام بتوع الكود بتاعك ودوس على علامة الصح الخضراء عشان تشوف سجل حضورك.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center pb-8">
           <p className="text-[10px] font-black text-slate-400 flex items-center justify-center gap-2 uppercase tracking-[0.3em]">
             <Code size={12} className="text-blue-400" /> 
             نظام المتابعة الذكي | الملاك روفائيل
           </p>
        </div>
      </div>
    </div>
  );
};
