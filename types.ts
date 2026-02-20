
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
  earlyBirds: number; // الذين حضروا قبل ميعاد معين
}
