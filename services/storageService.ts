
import { Youth, AttendanceRecord, SystemConfig, Marathon, MarathonGroup, MarathonActivityPoints, Servant, ServantAttendance, Visitation } from '../types';
import { db } from '../src/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc, query } from 'firebase/firestore';

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

  getYouth: async (): Promise<Youth[]> => {
    const querySnapshot = await getDocs(collection(db, 'youth'));
    return querySnapshot.docs.map(doc => doc.data() as Youth);
  },
  getAttendance: async (): Promise<AttendanceRecord[]> => {
    const querySnapshot = await getDocs(collection(db, 'attendance'));
    return querySnapshot.docs.map(doc => doc.data() as AttendanceRecord);
  },

  saveYouth: async (youth: Youth[]) => {
    for (const y of youth) {
      await setDoc(doc(db, 'youth', y.id), y);
    }
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },

  saveAttendance: async (records: AttendanceRecord[]) => {
    for (const r of records) {
      await setDoc(doc(db, 'attendance', r.id), r);
    }
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },

  // Servant Methods
  getServants: async (): Promise<Servant[]> => {
    const querySnapshot = await getDocs(collection(db, 'servants'));
    return querySnapshot.docs.map(doc => doc.data() as Servant);
  },
  saveServants: async (servants: Servant[]) => {
    for (const s of servants) {
      await setDoc(doc(db, 'servants', s.id), s);
    }
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },
  addServant: async (servant: Servant) => {
    await setDoc(doc(db, 'servants', servant.id), servant);
  },
  updateServant: async (servant: Servant) => {
    await setDoc(doc(db, 'servants', servant.id), servant);
  },
  deleteServant: async (id: string) => {
    await deleteDoc(doc(db, 'servants', id));
  },

  // Marathon Methods
  getMarathons: async (): Promise<Marathon[]> => {
    const querySnapshot = await getDocs(collection(db, 'marathons'));
    return querySnapshot.docs.map(doc => doc.data() as Marathon);
  },
  saveMarathons: async (marathons: Marathon[]) => {
    for (const m of marathons) {
      await setDoc(doc(db, 'marathons', m.id), m);
    }
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },
  addMarathon: async (marathon: Marathon) => {
    await setDoc(doc(db, 'marathons', marathon.id), marathon);
  },
  updateMarathon: async (marathon: Marathon) => {
    await setDoc(doc(db, 'marathons', marathon.id), marathon);
  },

  getMarathonGroups: async (): Promise<MarathonGroup[]> => {
    const querySnapshot = await getDocs(collection(db, 'marathonGroups'));
    return querySnapshot.docs.map(doc => doc.data() as MarathonGroup);
  },
  saveMarathonGroups: async (groups: MarathonGroup[]) => {
    for (const g of groups) {
      await setDoc(doc(db, 'marathonGroups', g.id), g);
    }
    window.dispatchEvent(new Event('storage_updated'));
    return true;
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

  getMarathonActivityPoints: async (): Promise<MarathonActivityPoints[]> => {
    const querySnapshot = await getDocs(collection(db, 'marathonActivityPoints'));
    return querySnapshot.docs.map(doc => doc.data() as MarathonActivityPoints);
  },
  saveMarathonActivityPoints: async (points: MarathonActivityPoints[]) => {
    for (const p of points) {
      await setDoc(doc(db, 'marathonActivityPoints', p.id), p);
    }
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },
  addMarathonActivityPoints: async (point: MarathonActivityPoints) => {
    await setDoc(doc(db, 'marathonActivityPoints', point.id), point);
  },

  // Special Follow-up Methods
  getServantAttendance: async (): Promise<ServantAttendance[]> => {
    const querySnapshot = await getDocs(collection(db, 'servantAttendance'));
    return querySnapshot.docs.map(doc => doc.data() as ServantAttendance);
  },
  saveServantAttendance: async (records: ServantAttendance[]) => {
    for (const r of records) {
      await setDoc(doc(db, 'servantAttendance', r.id), r);
    }
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },
  getVisitations: async (): Promise<Visitation[]> => {
    const querySnapshot = await getDocs(collection(db, 'visitations'));
    return querySnapshot.docs.map(doc => doc.data() as Visitation);
  },
  saveVisitations: async (visitations: Visitation[]) => {
    for (const v of visitations) {
      await setDoc(doc(db, 'visitations', v.id), v);
    }
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },
  addVisitation: async (visitation: Visitation) => {
    await setDoc(doc(db, 'visitations', visitation.id), visitation);
  },
  deleteVisitation: async (id: string) => {
    await deleteDoc(doc(db, 'visitations', id));
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
