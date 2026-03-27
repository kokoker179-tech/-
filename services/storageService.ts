
import { Youth, AttendanceRecord, SystemConfig, Marathon, MarathonGroup, MarathonActivityPoints, Servant, ServantAttendance, Visitation } from '../types';
import { db } from '../src/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';

const CONFIG_KEY = 'church_db_config_v3';
const SESSION_KEY = 'church_session_auth_v3';
const SPECIAL_ACCESS_KEY = 'church_special_access_v3';
const DEVICE_ID_KEY = 'church_device_id_v3';

const getDeviceId = () => {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = Math.random().toString(36).substr(2, 9);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
};

const DEFAULT_CONFIG: SystemConfig = {
  churchName: 'كنيسة الملاك روفائيل',
  meetingName: 'اجتماع ثانوي بنين',
  adminPassword: 'kerolos0',
  grades: ['أولى ثانوي', 'تانية ثانوي', 'تالتة ثانوي']
};

export const storageService = {
  isLoggedIn: async (): Promise<boolean> => {
    try {
      const deviceId = getDeviceId();
      const docSnap = await getDoc(doc(db, 'sessions', deviceId));
      return docSnap.exists() && docSnap.data().isLoggedIn === true;
    } catch {
      return localStorage.getItem(SESSION_KEY) === 'true';
    }
  },
  isSpecialAccess: async (): Promise<boolean> => {
    try {
      const deviceId = getDeviceId();
      const docSnap = await getDoc(doc(db, 'sessions', deviceId));
      return docSnap.exists() && docSnap.data().isSpecialAccess === true;
    } catch {
      return localStorage.getItem(SPECIAL_ACCESS_KEY) === 'true';
    }
  },
  setLoggedIn: async (status: boolean, isSpecial: boolean = false) => {
    const deviceId = getDeviceId();
    if (status) {
      localStorage.setItem(SESSION_KEY, 'true');
      if (isSpecial) localStorage.setItem(SPECIAL_ACCESS_KEY, 'true');
      else localStorage.removeItem(SPECIAL_ACCESS_KEY);
      
      await setDoc(doc(db, 'sessions', deviceId), {
        isLoggedIn: true,
        isSpecialAccess: isSpecial,
        lastActive: new Date().toISOString()
      });
    } else {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SPECIAL_ACCESS_KEY);
      await deleteDoc(doc(db, 'sessions', deviceId));
    }
    window.dispatchEvent(new Event('storage_updated'));
  },
  logout: async () => {
    const deviceId = getDeviceId();
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SPECIAL_ACCESS_KEY);
    await deleteDoc(doc(db, 'sessions', deviceId));
    window.dispatchEvent(new Event('storage_updated'));
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

  getConfig: async (): Promise<SystemConfig> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'config'));
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as SystemConfig;
      }
      return DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  saveConfig: async (config: SystemConfig): Promise<boolean> => {
    await setDoc(doc(db, 'config', 'main'), config);
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },

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
  addMarathonGroup: async (marathonId: string, groupData: Omit<MarathonGroup, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newGroup = { ...groupData, id };
    await setDoc(doc(db, 'marathonGroups', id), newGroup);
    
    // Note: This logic needs to be updated to handle Firestore for marathon updates too
    // For now, keeping it simple as per previous structure
    return newGroup;
  },
  updateMarathonGroup: async (group: MarathonGroup) => {
    await setDoc(doc(db, 'marathonGroups', group.id), group);
  },
  deleteMarathonGroup: async (groupId: string) => {
    await deleteDoc(doc(db, 'marathonGroups', groupId));
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
    await deleteDoc(doc(db, 'attendance', recordId));
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },

  resetAttendanceFromDate: async (date: string): Promise<boolean> => {
    const querySnapshot = await getDocs(collection(db, 'attendance'));
    const recordsToDelete = querySnapshot.docs.filter(doc => (doc.data() as AttendanceRecord).date >= date);
    for (const record of recordsToDelete) {
      await deleteDoc(doc(db, 'attendance', record.id));
    }
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },

  wipeAllAttendance: async (): Promise<boolean> => {
    const querySnapshot = await getDocs(collection(db, 'attendance'));
    for (const record of querySnapshot.docs) {
      await deleteDoc(doc(db, 'attendance', record.id));
    }
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },

  wipeAllYouth: async (): Promise<boolean> => {
    const querySnapshot = await getDocs(collection(db, 'youth'));
    for (const youth of querySnapshot.docs) {
      await deleteDoc(doc(db, 'youth', youth.id));
    }
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },

  factoryReset: async () => {
    await storageService.wipeAllAttendance();
    await storageService.wipeAllYouth();
    
    const collections = ['servants', 'marathons', 'marathonGroups', 'marathonActivityPoints', 'servantAttendance', 'visitations'];
    for (const coll of collections) {
      const querySnapshot = await getDocs(collection(db, coll));
      for (const d of querySnapshot.docs) {
        await deleteDoc(doc(db, coll, d.id));
      }
    }
    
    localStorage.clear();
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },

  deleteYouth: async (id: string): Promise<boolean> => {
    await deleteDoc(doc(db, 'youth', id));
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },

  pushToCloud: async () => {
    return true;
  },

  syncFromCloud: async (force = false) => {
    return { success: true };
  }
};
