
import { Youth, AttendanceRecord, SystemConfig } from '../types';

const YOUTH_KEY = 'church_db_youth_v3';
const ATTENDANCE_KEY = 'church_db_attendance_v3';
const CONFIG_KEY = 'church_db_config_v3';
const SESSION_KEY = 'church_session_auth_v3';
const LAST_SYNC_KEY = 'church_db_last_sync_v3';
const DIRTY_FLAG = 'church_db_is_dirty';

const API_URL = 'https://api.npoint.io/85045a2741165e6481c4'; 

const DEFAULT_CONFIG: SystemConfig = {
  churchName: 'كنيسة الملاك روفائيل',
  meetingName: 'اجتماع ثانوي بنين',
  adminPassword: 'kerolos0',
  grades: ['أولى ثانوي', 'تانية ثانوي', 'تالتة ثانوي']
};

export const storageService = {
  isLoggedIn: (): boolean => localStorage.getItem(SESSION_KEY) === 'true',
  setLoggedIn: (status: boolean) => {
    if (status) localStorage.setItem(SESSION_KEY, 'true');
    else localStorage.removeItem(SESSION_KEY);
  },
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getTheme: (): 'light' | 'dark' => (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  setTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem('theme', theme);
    window.dispatchEvent(new Event('ui_updated'));
  },
  getLang: (): 'ar' | 'en' => (localStorage.getItem('lang') as 'ar' | 'en') || 'ar',
  setLang: (lang: 'ar' | 'en') => {
    localStorage.setItem('lang', lang);
    window.dispatchEvent(new Event('ui_updated'));
  },

  getConfig: (): SystemConfig => {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  saveConfig: async (config: SystemConfig): Promise<boolean> => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    storageService.markDirty();
    const success = await storageService.pushToCloud();
    window.dispatchEvent(new Event('storage_updated'));
    return success;
  },

  markDirty: () => localStorage.setItem(DIRTY_FLAG, 'true'),
  clearDirty: () => localStorage.removeItem(DIRTY_FLAG),
  isDirty: () => localStorage.getItem(DIRTY_FLAG) === 'true',

  getYouth: (): Youth[] => {
    try { return JSON.parse(localStorage.getItem(YOUTH_KEY) || '[]'); } catch { return []; }
  },
  getAttendance: (): AttendanceRecord[] => {
    try { return JSON.parse(localStorage.getItem(ATTENDANCE_KEY) || '[]'); } catch { return []; }
  },

  saveYouth: async (youth: Youth[]) => {
    localStorage.setItem(YOUTH_KEY, JSON.stringify(youth));
    storageService.markDirty();
    const success = await storageService.pushToCloud();
    window.dispatchEvent(new Event('storage_updated'));
    return success;
  },

  saveAttendance: async (records: AttendanceRecord[]) => {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
    storageService.markDirty();
    const success = await storageService.pushToCloud();
    window.dispatchEvent(new Event('storage_updated'));
    return success;
  },

  /**
   * حذف ملف شاب بالكامل فورياً
   */
  deleteYouth: async (id: string): Promise<boolean> => {
    const currentYouth = storageService.getYouth();
    const currentAttendance = storageService.getAttendance();

    const updatedYouth = currentYouth.filter(y => y.id !== id);
    const updatedAttendance = currentAttendance.filter(r => r.youthId !== id);
    
    // حفظ محلي فوري
    localStorage.setItem(YOUTH_KEY, JSON.stringify(updatedYouth));
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(updatedAttendance));
    
    storageService.markDirty();
    // إشعار الواجهة بالتغيير فوراً
    window.dispatchEvent(new Event('storage_updated'));
    
    // المزامنة مع السحاب في الخلفية
    return await storageService.pushToCloud();
  },

  /**
   * حذف سجل حضور واحد فورياً
   */
  deleteAttendanceRecord: async (recordId: string): Promise<boolean> => {
    const currentAttendance = storageService.getAttendance();
    const updatedAttendance = currentAttendance.filter(r => r.id !== recordId);
    
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(updatedAttendance));
    storageService.markDirty();
    window.dispatchEvent(new Event('storage_updated'));
    
    return await storageService.pushToCloud();
  },

  /**
   * تصفير حضور يوم معين فورياً
   */
  clearAttendanceByDate: async (date: string): Promise<boolean> => {
    const currentAttendance = storageService.getAttendance();
    const updatedAttendance = currentAttendance.filter(r => r.date !== date);
    
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(updatedAttendance));
    storageService.markDirty();
    window.dispatchEvent(new Event('storage_updated'));
    
    return await storageService.pushToCloud();
  },

  wipeAllAttendance: async (): Promise<boolean> => {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([]));
    storageService.markDirty();
    window.dispatchEvent(new Event('storage_updated'));
    return await storageService.pushToCloud();
  },

  wipeAllYouth: async (): Promise<boolean> => {
    localStorage.setItem(YOUTH_KEY, JSON.stringify([]));
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify([]));
    storageService.markDirty();
    window.dispatchEvent(new Event('storage_updated'));
    return await storageService.pushToCloud();
  },

  factoryReset: async () => {
    const payload = { youth: [], attendance: [], config: DEFAULT_CONFIG, updatedAt: new Date().toISOString() };
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        localStorage.clear();
        window.location.reload();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  pushToCloud: async () => {
    window.dispatchEvent(new Event('sync_started'));
    try {
      const payload = {
        youth: storageService.getYouth(),
        attendance: storageService.getAttendance(),
        config: storageService.getConfig(),
        updatedAt: new Date().toISOString()
      };
      
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        storageService.clearDirty();
        localStorage.setItem(LAST_SYNC_KEY, new Date().toLocaleTimeString('ar-EG'));
        window.dispatchEvent(new Event('sync_ended'));
        return true;
      }
      throw new Error("Push error");
    } catch (e) {
      window.dispatchEvent(new Event('sync_error'));
      window.dispatchEvent(new Event('sync_ended'));
      return false;
    }
  },

  syncFromCloud: async (force = false) => {
    if (!force && storageService.isDirty()) {
      await storageService.pushToCloud();
      return { success: false, reason: 'dirty' };
    }

    window.dispatchEvent(new Event('sync_started'));
    try {
      const res = await fetch(API_URL + '?t=' + Date.now());
      if (!res.ok) throw new Error("Fetch failed");
      
      const data = await res.json();
      if (data) {
        if (Array.isArray(data.youth)) localStorage.setItem(YOUTH_KEY, JSON.stringify(data.youth));
        if (Array.isArray(data.attendance)) localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(data.attendance));
        if (data.config) localStorage.setItem(CONFIG_KEY, JSON.stringify(data.config));
        
        storageService.clearDirty();
        localStorage.setItem(LAST_SYNC_KEY, new Date().toLocaleTimeString('ar-EG'));
        window.dispatchEvent(new Event('storage_updated'));
        window.dispatchEvent(new Event('sync_ended'));
        return { success: true };
      }
      return { success: false };
    } catch (e) {
      window.dispatchEvent(new Event('sync_error'));
      window.dispatchEvent(new Event('sync_ended'));
      return { success: false };
    }
  }
};
