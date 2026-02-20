
export const GRADES = [
  'أولى ثانوي',
  'تانية ثانوي',
  'تالتة ثانوي'
];

export const APP_TITLE = "نظام حضور وغياب اجتماع ثانوي بنين كنيسه الملاك روفائيل";

/**
 * تاريخ بدء النظام الفعلي. لن تظهر أي تواريخ قبل هذا التاريخ في القوائم.
 */
export const SYSTEM_START_DATE = '2026-02-20';

/**
 * يحول التاريخ إلى صيغة YYYY-MM-DD بالتوقيت المحلي
 */
const toYYYYMMDD = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * يحصل على تاريخ الجمعة "النشطة" حالياً بناءً على الوقت الفعلي.
 * تبدأ الجمعة الجديدة من يوم السبت وتستمر حتى نهاية يوم الجمعة.
 */
export const getActiveFriday = (date: Date = new Date()): string => {
  const d = new Date(date);
  const day = d.getDay(); // 0: Sun, 1: Mon, ..., 5: Fri, 6: Sat

  // إذا كان اليوم السبت (6)، الجمعة القادمة هي بعد 6 أيام
  // إذا كان اليوم الجمعة (5)، الجمعة القادمة هي اليوم (0 أيام)
  let daysUntilFriday = (5 - day + 7) % 7;
  
  d.setDate(d.getDate() + daysUntilFriday);
  return toYYYYMMDD(d);
};

/**
 * جلب قائمة بالجمعات المتاحة بدءاً من تاريخ انطلاق النظام
 */
export const getRecentFridays = (limit: number = 5): string[] => {
  const fridays: string[] = [];
  let current = new Date(getActiveFriday());
  const startDate = new Date(SYSTEM_START_DATE);
  
  for (let i = 0; i < limit; i++) {
    // التوقف إذا وصلنا لتاريخ قبل تاريخ بدء النظام
    if (current < startDate) break;
    
    fridays.push(toYYYYMMDD(current));
    current.setDate(current.getDate() - 7);
  }
  
  // إذا كانت القائمة فارغة (مثلاً قبل أول جمعة)، أضف الجمعة القادمة على الأقل
  if (fridays.length === 0) {
    fridays.push(getActiveFriday());
  }
  
  return fridays;
};

export const isFriday = (dateStr: string): boolean => {
  const parts = dateStr.split('-');
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return d.getDay() === 5;
};

export const formatDateArabic = (dateStr: string) => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const parts = dateStr.split('-');
  // إنشاء التاريخ في التوقيت المحلي لتجنب مشاكل المناطق الزمنية
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return d.toLocaleDateString('ar-EG', options);
};

export const isPastDeadline = (selectedDate: string): boolean => {
  const now = new Date();
  const todayStr = toYYYYMMDD(now);
  
  if (selectedDate < todayStr) return true;
  if (selectedDate === todayStr) {
    return now.getHours() >= 23; // نهاية اليوم
  }
  return false;
};

export const isEvaluationWindow = (): boolean => {
  const now = new Date();
  return now.getDay() === 5 && now.getHours() >= 14 && now.getHours() < 15;
};
