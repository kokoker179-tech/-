
import React, { useState, useEffect, useRef } from 'react';
import { Save, ArrowRight, Edit3, Camera, X, FileText, UploadCloud } from 'lucide-react';
/* Fix: Use double quotes for react-router-dom imports */
import { Link, useNavigate, useParams } from "react-router-dom";
import { storageService } from '../services/storageService';
import { Youth } from '../types';

export const EditYouth: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const config = storageService.getConfig();
  
  const [formData, setFormData] = useState({
    name: '',
    grade: config.grades[0] || 'غير محدد',
    phone: '',
    image: '',
    pdfDoc: '',
    address: '',
    region: 'منطقة الكنيسة',
    fatherPhone: '',
    motherPhone: '',
    siblingsCount: 0
  });
  const [success, setSuccess] = useState(false);
  const [originalYouth, setOriginalYouth] = useState<Youth | null>(null);

  useEffect(() => {
    const youthList = storageService.getYouth();
    const found = youthList.find(y => y.id === id);
    if (found) {
      setOriginalYouth(found);
      setFormData({
        name: found.name,
        grade: found.grade,
        phone: found.phone,
        image: found.image || '',
        pdfDoc: found.pdfDoc || '',
        address: found.address || '',
        region: found.region || 'منطقة الكنيسة',
        fatherPhone: found.fatherPhone || '',
        motherPhone: found.motherPhone || '',
        siblingsCount: found.siblingsCount || 0
      });
    } else {
      navigate('/youth-list');
    }
  }, [id, navigate]);

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

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('يرجى اختيار ملف PDF فقط');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, pdfDoc: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !originalYouth) return;

    const youthList = storageService.getYouth();
    const updatedList = youthList.map(y => 
      y.id === id 
        ? { 
            ...y, 
            name: formData.name, 
            grade: formData.grade, 
            phone: formData.phone, 
            image: formData.image, 
            pdfDoc: formData.pdfDoc, 
            address: formData.address,
            region: formData.region,
            fatherPhone: formData.fatherPhone,
            motherPhone: formData.motherPhone,
            siblingsCount: formData.siblingsCount
          }
        : y
    );

    await storageService.saveYouth(updatedList);

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      navigate('/youth-list');
    }, 1500);
  };

  if (!originalYouth) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/youth-list" className="flex items-center gap-2 text-blue-600 mb-6 font-black hover:gap-4 transition-all">
        <ArrowRight size={20} />
        العودة لقائمة الشباب
      </Link>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Edit3 size={24} />
            </div>
            <h2 className="text-2xl font-black">تعديل بيانات الشاب</h2>
          </div>
          <p className="text-blue-100 font-bold opacity-90">تحديث معلومات الشاب: {originalYouth.name}</p>
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
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFormData(prev => ({...prev, image: ''})); }}
                    className="absolute top-1 left-1 p-1 bg-red-500 text-white rounded-full shadow-lg"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <Camera size={32} />
                  <span className="text-[10px] font-black mt-1">تعديل الصورة</span>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-black text-slate-700">اسم الشاب بالكامل</label>
            <input
              type="text"
              required
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
              placeholder="مثال: أبانوب عماد..."
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">رقم الهاتف (الشاب)</label>
              <input
                type="tel"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-left font-bold"
                dir="ltr"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">المنطقة</label>
              <select
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all bg-white font-bold"
                value={formData.region}
                onChange={e => setFormData({ ...formData, region: e.target.value })}
              >
                <option value="منطقة ترعة عبد العال">منطقة ترعة عبد العال</option>
                <option value="منطقة الكنيسة والتقسيم">منطقة الكنيسة والتقسيم</option>
                <option value="منطقة الملكة">منطقة الملكة</option>
                <option value="منطقة أبو زيد">منطقة أبو زيد</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">رقم الأب</label>
              <input
                type="tel"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-left font-bold"
                dir="ltr"
                value={formData.fatherPhone}
                onChange={e => setFormData({ ...formData, fatherPhone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">رقم الأم</label>
              <input
                type="tel"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-left font-bold"
                dir="ltr"
                value={formData.motherPhone}
                onChange={e => setFormData({ ...formData, motherPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">عدد الإخوة</label>
              <input
                type="number"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                value={formData.siblingsCount}
                onChange={e => setFormData({ ...formData, siblingsCount: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-black text-slate-700">العنوان</label>
            <input
              type="text"
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
              placeholder="العنوان بالتفصيل..."
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700">المستندات (ملف PDF)</label>
              <div 
                onClick={() => pdfInputRef.current?.click()}
                className={`w-full p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${formData.pdfDoc ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-blue-300'}`}
              >
                {formData.pdfDoc ? (
                  <div className="flex items-center gap-3 text-emerald-700">
                    <FileText size={32} />
                    <div className="text-right">
                      <p className="font-black text-sm">تم رفع المستند بنجاح</p>
                      <p className="text-[10px] font-bold">انقر لتغيير الملف</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <UploadCloud size={32} className="mb-2" />
                    <p className="text-xs font-black">رفع ملف PDF (اختياري)</p>
                    <p className="text-[9px] font-bold mt-1">تحديث مستند الشاب</p>
                  </div>
                )}
              </div>
              <input type="file" ref={pdfInputRef} accept="application/pdf" className="hidden" onChange={handlePdfChange} />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2 mt-4"
          >
            <Save size={22} />
            حفظ التعديلات
          </button>
        </form>
      </div>

      {success && (
        <div className="mt-6 p-5 bg-emerald-50 text-emerald-700 rounded-3xl border border-emerald-100 text-center font-black animate-bounce shadow-sm">
          تم تحديث البيانات بنجاح!
        </div>
      )}
    </div>
  );
};
