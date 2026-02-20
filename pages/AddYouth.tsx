
import React, { useState, useRef } from 'react';
import { UserPlus, Save, ArrowLeft, Camera, X, Hash, FileText, UploadCloud, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from "react-router-dom";
import { storageService } from '../services/storageService';
import { Youth } from '../types';

export const AddYouth: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const config = storageService.getConfig();
  
  const generateRandomCode = () => {
    const existingCodes = storageService.getYouth().map(y => y.code);
    let newCode = '';
    do {
      newCode = Math.floor(10000 + Math.random() * 90000).toString();
    } while (existingCodes.includes(newCode));
    return newCode;
  };

  const [formData, setFormData] = useState({
    name: '',
    grade: config.grades[0] || 'غير محدد',
    phone: '',
    image: '',
    pdfDoc: '',
    code: generateRandomCode(),
    confessionFather: '',
    address: ''
  });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const newYouth: Youth = {
      id: crypto.randomUUID(),
      name: formData.name,
      grade: formData.grade,
      phone: formData.phone,
      image: formData.image,
      pdfDoc: formData.pdfDoc,
      code: formData.code,
      addedAt: Date.now(),
      confessionFather: formData.confessionFather,
      address: formData.address
    };

    const currentYouth = storageService.getYouth();
    storageService.saveYouth([...currentYouth, newYouth]);

    setSuccess(true);
    setTimeout(() => {
        setSuccess(false);
        navigate('/youth-list');
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/" className="flex items-center gap-2 text-blue-600 mb-6 hover:underline font-bold">
        <ArrowLeft size={18} /> <span>العودة للرئيسية</span>
      </Link>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-blue-600 p-8 text-white">
          <h2 className="text-2xl font-black flex items-center gap-3"><UserPlus /> تسجيل شاب جديد</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">الاسم بالكامل</label>
              <input type="text" required className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">السنة الدراسية</label>
              <select className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-bold" value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })}>
                {config.grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">اسم أب الاعتراف</label>
              <div className="relative">
                <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="text" placeholder="أبونا..." className="w-full px-5 pr-12 py-4 rounded-2xl border border-slate-200 font-bold" value={formData.confessionFather} onChange={e => setFormData({ ...formData, confessionFather: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">رقم الهاتف</label>
              <input type="tel" className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-bold text-left" dir="ltr" placeholder="01xxxxxxxxx" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>

          <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">العنوان</label>
              <input type="text" className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-bold" placeholder="العنوان بالتفصيل..." value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] shadow-xl transition-all flex items-center justify-center gap-2">
            <Save size={20} /> حفظ بيانات الشاب
          </button>
        </form>
      </div>
    </div>
  );
};
