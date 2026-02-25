
import { Youth, AttendanceRecord, SystemConfig, Marathon, MarathonGroup, MarathonActivityPoints, Servant } from '../types';

const YOUTH_KEY = 'church_db_youth_v3';
const ATTENDANCE_KEY = 'church_db_attendance_v3';
const CONFIG_KEY = 'church_db_config_v3';
const SESSION_KEY = 'church_session_auth_v3';
const SPECIAL_ACCESS_KEY = 'church_special_access_v3';
const LAST_SYNC_KEY = 'church_db_last_sync_v3';
const DIRTY_FLAG = 'church_db_is_dirty';
const SERVANTS_KEY = 'church_db_servants';

const MARATHONS_KEY = 'church_db_marathons';
const MARATHON_GROUPS_KEY = 'church_db_marathon_groups';
const MARATHON_POINTS_KEY = 'church_db_marathon_points';

const API_URL = '/api/data'; 

const DEFAULT_CONFIG: SystemConfig = {
  churchName: 'كنيسة الملاك روفائيل',
  meetingName: 'اجتماع ثانوي بنين',
  adminPassword: 'kerolos0',
  grades: ['أولى ثانوي', 'تانية ثانوي', 'تالتة ثانوي']
};

export const storageService = {
  isLoggedIn: (): boolean => localStorage.getItem(SESSION_KEY) === 'true',
  isSpecialAccess: (): boolean => localStorage.getItem(SPECIAL_ACCESS_KEY) === 'true',
  setLoggedIn: (status: boolean, isSpecial: boolean = false) => {
    if (status) {
      localStorage.setItem(SESSION_KEY, 'true');
      if (isSpecial) localStorage.setItem(SPECIAL_ACCESS_KEY, 'true');
      else localStorage.removeItem(SPECIAL_ACCESS_KEY);
    } else {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SPECIAL_ACCESS_KEY);
    }
  },
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SPECIAL_ACCESS_KEY);
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

  // Servant Methods
  getServants: (): Servant[] => {
    try { return JSON.parse(localStorage.getItem(SERVANTS_KEY) || '[]'); } catch { return []; }
  },
  saveServants: async (servants: Servant[]) => {
    localStorage.setItem(SERVANTS_KEY, JSON.stringify(servants));
    storageService.markDirty();
    const success = await storageService.pushToCloud();
    window.dispatchEvent(new Event('storage_updated'));
    return success;
  },
  addServant: (servant: Servant) => {
    const current = storageService.getServants();
    storageService.saveServants([...current, servant]);
  },
  updateServant: (servant: Servant) => {
    const current = storageService.getServants();
    const idx = current.findIndex(s => s.id === servant.id);
    if (idx > -1) {
      current[idx] = servant;
      storageService.saveServants(current);
    }
  },
  deleteServant: async (id: string) => {
    const current = storageService.getServants().filter(s => s.id !== id);
    return await storageService.saveServants(current);
  },

  // Marathon Methods
  getMarathons: (): Marathon[] => {
    try { return JSON.parse(localStorage.getItem(MARATHONS_KEY) || '[]'); } catch { return []; }
  },
  saveMarathons: async (marathons: Marathon[]) => {
    localStorage.setItem(MARATHONS_KEY, JSON.stringify(marathons));
    storageService.markDirty();
    const success = await storageService.pushToCloud();
    window.dispatchEvent(new Event('storage_updated'));
    return success;
  },
  addMarathon: (marathon: Marathon) => {
    const current = storageService.getMarathons();
    storageService.saveMarathons([...current, marathon]);
  },
  updateMarathon: (marathon: Marathon) => {
    const current = storageService.getMarathons();
    const idx = current.findIndex(m => m.id === marathon.id);
    if (idx > -1) {
      current[idx] = marathon;
      storageService.saveMarathons(current);
    }
  },

  getMarathonGroups: (): MarathonGroup[] => {
    try { return JSON.parse(localStorage.getItem(MARATHON_GROUPS_KEY) || '[]'); } catch { return []; }
  },
  saveMarathonGroups: async (groups: MarathonGroup[]) => {
    localStorage.setItem(MARATHON_GROUPS_KEY, JSON.stringify(groups));
    storageService.markDirty();
    const success = await storageService.pushToCloud();
    window.dispatchEvent(new Event('storage_updated'));
    return success;
  },
  addMarathonGroup: (marathonId: string, groupData: Omit<MarathonGroup, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newGroup = { ...groupData, id };
    const groups = storageService.getMarathonGroups();
    storageService.saveMarathonGroups([...groups, newGroup]);
    
    const marathons = storageService.getMarathons();
    const mIdx = marathons.findIndex(m => m.id === marathonId);
    if (mIdx > -1) {
      marathons[mIdx].groupIds.push(id);
      storageService.saveMarathons(marathons);
    }
    return newGroup;
  },
  updateMarathonGroup: (group: MarathonGroup) => {
    const groups = storageService.getMarathonGroups();
    const idx = groups.findIndex(g => g.id === group.id);
    if (idx > -1) {
      groups[idx] = group;
      storageService.saveMarathonGroups(groups);
    }
  },
  deleteMarathonGroup: (groupId: string) => {
    const groups = storageService.getMarathonGroups().filter(g => g.id !== groupId);
    storageService.saveMarathonGroups(groups);
    
    const marathons = storageService.getMarathons();
    marathons.forEach(m => {
      m.groupIds = m.groupIds.filter(id => id !== groupId);
    });
    storageService.saveMarathons(marathons);
  },

  getMarathonActivityPoints: (): MarathonActivityPoints[] => {
    try { return JSON.parse(localStorage.getItem(MARATHON_POINTS_KEY) || '[]'); } catch { return []; }
  },
  saveMarathonActivityPoints: async (points: MarathonActivityPoints[]) => {
    localStorage.setItem(MARATHON_POINTS_KEY, JSON.stringify(points));
    storageService.markDirty();
    const success = await storageService.pushToCloud();
    window.dispatchEvent(new Event('storage_updated'));
    return success;
  },
  addMarathonActivityPoints: (point: MarathonActivityPoints) => {
    const current = storageService.getMarathonActivityPoints();
    storageService.saveMarathonActivityPoints([...current, point]);
  },

  deleteAttendanceRecord: async (recordId: string): Promise<boolean> => {
    const currentAttendance = storageService.getAttendance();
    const recordToDelete = currentAttendance.find(r => r.id === recordId);
    
    if (recordToDelete) {
      // Remove attendance record
      const updatedAttendance = currentAttendance.filter(r => r.id !== recordId);
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(updatedAttendance));

      // Also remove associated marathon points for this youth on this date
      const currentPoints = storageService.getMarathonActivityPoints();
      const updatedPoints = currentPoints.filter(p => 
        !(p.youthId === recordToDelete.youthId && p.weekDate === recordToDelete.date)
      );
      localStorage.setItem(MARATHON_POINTS_KEY, JSON.stringify(updatedPoints));
    }

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
    const payload = { 
      youth: [], 
      attendance: [], 
      marathons: [],
      marathonGroups: [],
      marathonPoints: [],
      servants: [],
      config: DEFAULT_CONFIG, 
      updatedAt: new Date().toISOString() 
    };
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

  deleteYouth: async (id: string): Promise<boolean> => {
    const currentYouth = storageService.getYouth();
    const currentAttendance = storageService.getAttendance();

    const updatedYouth = currentYouth.filter(y => y.id !== id);
    const updatedAttendance = currentAttendance.filter(r => r.youthId !== id);
    
    // Also remove from marathon groups
    const groups = storageService.getMarathonGroups();
    groups.forEach(g => {
      g.youthIds = g.youthIds.filter(yId => yId !== id);
    });
    storageService.saveMarathonGroups(groups);

    localStorage.setItem(YOUTH_KEY, JSON.stringify(updatedYouth));
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(updatedAttendance));
    
    storageService.markDirty();
    window.dispatchEvent(new Event('storage_updated'));
    return await storageService.pushToCloud();
  },

  pushToCloud: async () => {
    window.dispatchEvent(new Event('sync_started'));
    try {
      const payload = {
        youth: storageService.getYouth(),
        attendance: storageService.getAttendance(),
        config: storageService.getConfig(),
        marathons: storageService.getMarathons(),
        marathonGroups: storageService.getMarathonGroups(),
        marathonPoints: storageService.getMarathonActivityPoints(),
        servants: storageService.getServants(),
        updatedAt: new Date().toISOString()
      };
      
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        storageService.clearDirty();
        const now = new Date().toLocaleString('ar-EG');
        localStorage.setItem(LAST_SYNC_KEY, now);
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
        if (Array.isArray(data.marathons)) localStorage.setItem(MARATHONS_KEY, JSON.stringify(data.marathons));
        if (Array.isArray(data.marathonGroups)) localStorage.setItem(MARATHON_GROUPS_KEY, JSON.stringify(data.marathonGroups));
        if (Array.isArray(data.marathonPoints)) localStorage.setItem(MARATHON_POINTS_KEY, JSON.stringify(data.marathonPoints));
        if (Array.isArray(data.servants)) localStorage.setItem(SERVANTS_KEY, JSON.stringify(data.servants));

        storageService.clearDirty();
        const now = new Date().toLocaleString('ar-EG');
        localStorage.setItem(LAST_SYNC_KEY, now);
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
