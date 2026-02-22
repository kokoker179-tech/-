
export type Lang = 'ar' | 'en';

const translations = {
  ar: {
    dashboard: "لوحة التحكم",
    registerAttendance: "تسجيل الحضور",
    marathon: "الماراثون",
    servants: "الخدام",
    youthPortal: "بوابة الشباب",
    fullHistory: "سجل الحضور الكامل",
    addNewYouth: "تسجيل شاب جديد",
    youthList: "قائمة الشباب",
    settings: "الإعدادات والبيانات",
    logout: "تسجيل الخروج",
    theme: "المظهر",
    language: "اللغة",
    activeFriday: "الجمعة النشطة",
    followUpPortal: "بوابة المتابعة",
    syncActive: "مزامنة نشطة",
    weeklyFollowUp: "جدول المتابعة الأسبوعي",
    updatedNow: "محدث الآن",
    youthName: "اسم الشاب",
    lastConfession: "آخر اعتراف",
    recentStatus: "حالة آخر ٤ أسابيع",
    profile: "الملف",
    noRecords: "لا توجد سجلات",
    searchPlaceholder: "ابحث عن اسم..."
  },
  en: {
    dashboard: "Dashboard",
    registerAttendance: "Attendance Entry",
    marathon: "Marathon",
    servants: "Servants",
    youthPortal: "Youth Portal",
    fullHistory: "Attendance History",
    addNewYouth: "Add New Youth",
    youthList: "Youth Directory",
    settings: "Settings & Cloud",
    logout: "Sign Out",
    theme: "Theme",
    language: "Language",
    activeFriday: "Active Friday",
    followUpPortal: "Follow-up Portal",
    syncActive: "Live Sync Active",
    weeklyFollowUp: "Weekly Follow-up Table",
    updatedNow: "Updated Now",
    youthName: "Youth Name",
    lastConfession: "Last Confession",
    recentStatus: "Last 4 Weeks Status",
    profile: "Profile",
    noRecords: "No records found",
    searchPlaceholder: "Search names..."
  }
};

export const t = (key: keyof typeof translations.ar, lang: Lang) => {
  return translations[lang][key] || key;
};
