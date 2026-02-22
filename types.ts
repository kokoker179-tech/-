
export interface Youth {
  id: string;
  name: string;
  grade: string;
  phone: string;
  code: string; 
  image?: string; 
  pdfDoc?: string; 
  addedAt: number;
  confessionFather?: string; // اسم أب الاعتراف الثابت
  address?: string; // عنوان الشاب
}

export interface Servant {
  id: string;
  name: string;
  role: string; // e.g., 'خادم', 'أمين خدمة', 'أمين مساعد'
  phone: string;
  responsibility?: string; // e.g., 'مجموعة القديس مارمرقس'
  addedAt: number;
}

export interface AttendanceRecord {
  id: string;
  youthId: string;
  date: string; 
  liturgy: boolean;
  liturgyTime?: string; // وقت حضور القداس
  meeting: boolean;
  meetingTime?: string; // وقت حضور الاجتماع
  visitation: boolean;
  bibleReading: boolean;
  confession: boolean;
  confessionDate?: string; // تاريخ الاعتراف (إذا تم اليوم)
  confessorName?: string; // اسم أب الاعتراف (الذي اعترف معه هذه المرة)
  visitationDetails?: {
    visitorName: string;
    visitDate: string;
  };
  // Marathon Fields
  tasbeha?: boolean;
  weeklyCompetition?: boolean;
  communion?: boolean;
  exodusCompetition?: boolean;
  memorizationPart?: boolean;
  fasting?: boolean;
}

export interface SystemConfig {
  churchName: string;
  meetingName: string;
  adminPassword: string;
  grades: string[];
  lastCloudSync?: string;
}

export interface WeeklyStats {
  totalToday: number;
  totalLiturgy: number;
  totalMeeting: number;
  earlyBirds: number;
}

// Marathon Data Models
export interface MarathonPointSystem {
  confession: number; // الاعتراف
  tasbeha: number; // التسبيحة
  meeting: number; // الاجتماع
  weeklyCompetition: number; // مسابقة كل جمعة
  liturgy: number; // القداس
  communion: number; // التناول
  exodusCompetition: number; // مسابقة سفر الخروج
  memorizationPart: number; // جزء الحفظ
  fasting: number; // الصوم
}

export interface MarathonGroup {
  id: string;
  name: string;
  servantName: string;
  youthIds: string[];
}

export interface Marathon {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  pointSystem: MarathonPointSystem;
  groupIds: string[];
  active: boolean;
  winnerGroupId?: string;
}

export interface MarathonActivityPoints {
  marathonId: string;
  youthId: string;
  weekDate: string; // YYYY-MM-DD (the Friday of the week)
  activity: keyof MarathonPointSystem; // e.g., 'liturgy', 'confession'
  points: number;
  reason: string; // e.g., 'حضور قداس', 'فوز في مسابقة الجمعة'
  timestamp: number; // When the points were awarded
}
