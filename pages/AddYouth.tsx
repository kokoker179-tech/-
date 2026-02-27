
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
    address: '',
    region: 'منطقة الكنيسة والتقسيم',
    fatherPhone: '',
    motherPhone: '',
    siblingsCount: 0
  });
  const [success, setSuccess] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setFormData(prev => ({ ...prev, image: canvas.toDataURL('image/jpeg', 0.7) }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      address: formData.address,
      region: formData.region,
      fatherPhone: formData.fatherPhone,
      motherPhone: formData.motherPhone,
      siblingsCount: formData.siblingsCount
    };

    const currentYouth = storageService.getYouth();
    await storageService.saveYouth([...currentYouth, newYouth]);

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
          <div className="flex flex-col items-center mb-4">
            <div 
              className="relative w-32 h-32 rounded-[2.5rem] bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.image ? (
                <>
                  <img src={formData.image} alt="معاينة" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="text-white" size={24} />
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 group-hover:text-blue-500 transition-colors">
                  <Camera size={32} className="mx-auto mb-2" />
                  <span className="text-xs font-black">إضافة صورة</span>
                </div>
              )}
            </div>
            {formData.image && (
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, image: '' })); }}
                className="mt-3 text-rose-500 text-xs font-black flex items-center gap-1 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-colors"
              >
                <X size={14} /> إزالة الصورة
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

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
              <label className="block text-sm font-black text-slate-700">رقم الهاتف (الشاب)</label>
              <input type="tel" className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-bold text-left" dir="ltr" placeholder="01xxxxxxxxx" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">رقم الأب</label>
              <input type="tel" className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-bold text-left" dir="ltr" placeholder="01xxxxxxxxx" value={formData.fatherPhone} onChange={e => setFormData({ ...formData, fatherPhone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">رقم الأم</label>
              <input type="tel" className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-bold text-left" dir="ltr" placeholder="01xxxxxxxxx" value={formData.motherPhone} onChange={e => setFormData({ ...formData, motherPhone: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">المنطقة</label>
              <select className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-bold" value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })}>
                <option value="ترعة عبد العال">ترعة عبد العال</option>
                <option value="منطقة الكنيسة والتقسيم">منطقة الكنيسة والتقسيم</option>
                <option value="منطقة الملكة">منطقة الملكة</option>
                <option value="منطقة أبو زيد">منطقة أبو زيد</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">عدد الإخوة</label>
              <input type="number" className="w-full px-5 py-4 rounded-2xl border border-slate-200 font-bold" value={formData.siblingsCount} onChange={e => setFormData({ ...formData, siblingsCount: parseInt(e.target.value) || 0 })} />
            </div>
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
