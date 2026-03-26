
import { Youth, AttendanceRecord, SystemConfig, Marathon, MarathonGroup, MarathonActivityPoints, Servant, ServantAttendance, Visitation } from '../types';

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
const SERVANT_ATTENDANCE_KEY = 'church_db_servant_attendance';
const VISITATION_KEY = 'church_db_visitation';

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
    try {
      const saved = localStorage.getItem(YOUTH_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },
  getAttendance: (): AttendanceRecord[] => {
    try {
      const saved = localStorage.getItem(ATTENDANCE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  saveYouth: async (youth: Youth[]) => {
    localStorage.setItem(YOUTH_KEY, JSON.stringify(youth));
    storageService.markDirty();
    window.dispatchEvent(new Event('storage_updated'));
    return await storageService.pushToCloud();
  },

  saveAttendance: async (records: AttendanceRecord[]) => {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
    storageService.markDirty();
    window.dispatchEvent(new Event('storage_updated'));
    return await storageService.pushToCloud();
  },

  // Servant Methods
  getServants: (): Servant[] => {
    try {
      const saved = localStorage.getItem(SERVANTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },
  saveServants: async (servants: Servant[]) => {
    localStorage.setItem(SERVANTS_KEY, JSON.stringify(servants));
    storageService.markDirty();
    window.dispatchEvent(new Event('storage_updated'));
    return await storageService.pushToCloud();
  },
  addServant: async (servant: Servant) => {
    const servants = storageService.getServants();
    await storageService.saveServants([...servants, servant]);
  },
  updateServant: async (servant: Servant) => {
    const servants = storageService.getServants();
    const idx = servants.findIndex(s => s.id === servant.id);
    if (idx > -1) {
      servants[idx] = servant;
      await storageService.saveServants(servants);
    }
  },
  deleteServant: async (id: string) => {
    const servants = storageService.getServants().filter(s => s.id !== id);
    await storageService.saveServants(servants);
  },

  // Marathon Methods
  getMarathons: (): Marathon[] => {
    try {
      const saved = localStorage.getItem(MARATHONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },
  saveMarathons: async (marathons: Marathon[]) => {
    localStorage.setItem(MARATHONS_KEY, JSON.stringify(marathons));
    storageService.markDirty();
    window.dispatchEvent(new Event('storage_updated'));
    return await storageService.pushToCloud();
  },
  addMarathon: async (marathon: Marathon) => {
    const marathons = storageService.getMarathons();
    await storageService.saveMarathons([...marathons, marathon]);
  },
  updateMarathon: async (marathon: Marathon) => {
    const marathons = storageService.getMarathons();
    const idx = marathons.findIndex(m => m.id === marathon.id);
    if (idx > -1) {
      marathons[idx] = marathon;
      await storageService.saveMarathons(marathons);
    }
  },

  getMarathonGroups: (): MarathonGroup[] => {
    try {
      const saved = localStorage.getItem(MARATHON_GROUPS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },
  saveMarathonGroups: async (groups: MarathonGroup[]) => {
    localStorage.setItem(MARATHON_GROUPS_KEY, JSON.stringify(groups));
    storageService.markDirty();
    window.dispatchEvent(new Event('storage_updated'));
    return await storageService.pushToCloud();
  },
  addMarathonGroup: async (marathonId: string, groupData: Omit<MarathonGroup, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newGroup = { ...groupData, id };
    const groups = storageService.getMarathonGroups();
    await storageService.saveMarathonGroups([...groups, newGroup]);
    
    const marathons = storageService.getMarathons();
    const mIdx = marathons.findIndex(m => m.id === marathonId);
    if (mIdx > -1) {
      marathons[mIdx].groupIds.push(id);
      await storageService.saveMarathons(marathons);
    }
    return newGroup;
  },
  updateMarathonGroup: async (group: MarathonGroup) => {
    const groups = storageService.getMarathonGroups();
    const idx = groups.findIndex(g => g.id === group.id);
    if (idx > -1) {
      groups[idx] = group;
      await storageService.saveMarathonGroups(groups);
    }
  },
  deleteMarathonGroup: async (groupId: string) => {
    const groups = storageService.getMarathonGroups().filter(g => g.id !== groupId);
    await storageService.saveMarathonGroups(groups);
    
    const marathons = storageService.getMarathons();
    marathons.forEach(m => {
      m.groupIds = m.groupIds.filter(id => id !== groupId);
    });
    await storageService.saveMarathons(marathons);
  },

  getMarathonActivityPoints: (): MarathonActivityPoints[] => {
    try {
      const saved = localStorage.getItem(MARATHON_POINTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },
  saveMarathonActivityPoints: async (points: MarathonActivityPoints[]) => {
    localStorage.setItem(MARATHON_POINTS_KEY, JSON.stringify(points));
    storageService.markDirty();
    window.dispatchEvent(new Event('storage_updated'));
    return await storageService.pushToCloud();
  },
  addMarathonActivityPoints: async (point: MarathonActivityPoints) => {
    const points = storageService.getMarathonActivityPoints();
    await storageService.saveMarathonActivityPoints([...points, point]);
  },

  // Special Follow-up Methods
  getServantAttendance: (): ServantAttendance[] => {
    try {
      const saved = localStorage.getItem(SERVANT_ATTENDANCE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },
  saveServantAttendance: async (records: ServantAttendance[]) => {
    localStorage.setItem(SERVANT_ATTENDANCE_KEY, JSON.stringify(records));
    storageService.markDirty();
    window.dispatchEvent(new Event('storage_updated'));
    return await storageService.pushToCloud();
  },
  getVisitations: (): Visitation[] => {
    try {
      const saved = localStorage.getItem(VISITATION_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },
  saveVisitations: async (visitations: Visitation[]) => {
    localStorage.setItem(VISITATION_KEY, JSON.stringify(visitations));
    storageService.markDirty();
    window.dispatchEvent(new Event('storage_updated'));
    return await storageService.pushToCloud();
  },
  addVisitation: async (visitation: Visitation) => {
    const visitations = storageService.getVisitations();
    await storageService.saveVisitations([...visitations, visitation]);
  },
  deleteVisitation: async (id: string) => {
    const visitations = storageService.getVisitations().filter(v => v.id !== id);
    await storageService.saveVisitations(visitations);
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

  resetAttendanceFromDate: async (date: string): Promise<boolean> => {
    const currentAttendance = storageService.getAttendance();
    const currentPoints = storageService.getMarathonActivityPoints();

    // Filter attendance records: keep only those >= date
    const updatedAttendance = currentAttendance.filter(r => r.date >= date);
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(updatedAttendance));

    // Filter marathon points: keep only those where weekDate >= date
    const updatedPoints = currentPoints.filter(p => p.weekDate >= date);
    localStorage.setItem(MARATHON_POINTS_KEY, JSON.stringify(updatedPoints));

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
    await storageService.saveMarathonGroups(groups);

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
        servantAttendance: storageService.getServantAttendance(),
        visitations: storageService.getVisitations(),
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
        if (Array.isArray(data.servantAttendance)) localStorage.setItem(SERVANT_ATTENDANCE_KEY, JSON.stringify(data.servantAttendance));
        if (Array.isArray(data.visitations)) localStorage.setItem(VISITATION_KEY, JSON.stringify(data.visitations));

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
