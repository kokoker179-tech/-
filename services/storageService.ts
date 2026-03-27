
import { Youth, AttendanceRecord, SystemConfig, Marathon, MarathonGroup, MarathonActivityPoints, Servant, ServantAttendance, Visitation } from '../types';
import { db, auth } from '../src/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, setDoc, doc, deleteDoc, getDoc, getDocFromServer, getDocsFromServer } from 'firebase/firestore';

const CONFIG_KEY = 'church_db_config_v3';
const SESSION_KEY = 'church_session_auth_v3';
const SPECIAL_ACCESS_KEY = 'church_special_access_v3';
const DEVICE_ID_KEY = 'church_device_id_v3';

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), timeoutMs))
  ]);
};

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
      if (!auth.currentUser) return localStorage.getItem(SESSION_KEY) === 'true';
      const docSnap = await withTimeout(getDoc(doc(db, 'sessions', auth.currentUser.uid)), 5000);
      return docSnap.exists() && docSnap.data().isLoggedIn === true;
    } catch {
      return localStorage.getItem(SESSION_KEY) === 'true';
    }
  },
  isSpecialAccess: async (): Promise<boolean> => {
    try {
      if (!auth.currentUser) return localStorage.getItem(SPECIAL_ACCESS_KEY) === 'true';
      const docSnap = await withTimeout(getDoc(doc(db, 'sessions', auth.currentUser.uid)), 5000);
      return docSnap.exists() && docSnap.data().isSpecialAccess === true;
    } catch {
      return localStorage.getItem(SPECIAL_ACCESS_KEY) === 'true';
    }
  },
  setLoggedIn: async (status: boolean, isSpecial: boolean = false) => {
    if (status) {
      localStorage.setItem(SESSION_KEY, 'true');
      if (isSpecial) localStorage.setItem(SPECIAL_ACCESS_KEY, 'true');
      else localStorage.removeItem(SPECIAL_ACCESS_KEY);
      
      const deviceId = getDeviceId();
      let user = auth.currentUser;
      
      // Try to write session to Firestore using UID if available, otherwise deviceId
      const sessionId = user ? user.uid : deviceId;
      
      try {
        await setDoc(doc(db, 'sessions', sessionId), {
          isLoggedIn: true,
          isSpecialAccess: isSpecial,
          uid: user?.uid || null,
          deviceId: deviceId,
          email: user?.email || null,
          lastActive: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to save session to cloud:', err);
      }
    } else {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SPECIAL_ACCESS_KEY);
      const deviceId = getDeviceId();
      const sessionId = auth.currentUser ? auth.currentUser.uid : deviceId;
      await deleteDoc(doc(db, 'sessions', sessionId)).catch(() => {});
    }
    window.dispatchEvent(new Event('storage_updated'));
  },
  logout: async () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SPECIAL_ACCESS_KEY);
    if (auth.currentUser) {
      await deleteDoc(doc(db, 'sessions', auth.currentUser.uid)).catch(() => {});
    }
    await signOut(auth).catch(err => console.error('Sign out error:', err));
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
      const configDoc = await withTimeout(getDoc(doc(db, 'config', 'main')));
      if (configDoc.exists()) {
        return configDoc.data() as SystemConfig;
      }
      return DEFAULT_CONFIG;
    } catch (error) {
      console.error('Error fetching config:', error);
      return DEFAULT_CONFIG;
    }
  },

  saveConfig: async (config: SystemConfig): Promise<boolean> => {
    await setDoc(doc(db, 'config', 'main'), config);
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },

  getYouth: async (): Promise<Youth[]> => {
    try {
      const querySnapshot = await withTimeout(getDocs(collection(db, 'youth')));
      return querySnapshot.docs.map(doc => doc.data() as Youth);
    } catch (error) {
      console.error('Error fetching youth:', error);
      return [];
    }
  },
  getAttendance: async (): Promise<AttendanceRecord[]> => {
    try {
      const querySnapshot = await withTimeout(getDocs(collection(db, 'attendance')));
      return querySnapshot.docs.map(doc => doc.data() as AttendanceRecord);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return [];
    }
  },

  saveYouth: async (youth: Youth[]) => {
    for (const y of youth) {
      await setDoc(doc(db, 'youth', y.id), y);
    }
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },
  saveSingleYouth: async (youth: Youth) => {
    await setDoc(doc(db, 'youth', youth.id), youth);
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },

  saveAttendance: async (records: AttendanceRecord[]) => {
    // This is inefficient for large datasets, but kept for bulk updates if needed
    for (const r of records) {
      await setDoc(doc(db, 'attendance', r.id), r);
    }
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },

  saveSingleAttendance: async (record: AttendanceRecord) => {
    await setDoc(doc(db, 'attendance', record.id), record);
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },

  // Servant Methods
  getServants: async (): Promise<Servant[]> => {
    try {
      const querySnapshot = await withTimeout(getDocs(collection(db, 'servants')));
      return querySnapshot.docs.map(doc => doc.data() as Servant);
    } catch (error) {
      console.error('Error fetching servants:', error);
      return [];
    }
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
    try {
      const querySnapshot = await withTimeout(getDocs(collection(db, 'marathons')));
      return querySnapshot.docs.map(doc => doc.data() as Marathon);
    } catch (error) {
      console.error('Error fetching marathons:', error);
      return [];
    }
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
    window.dispatchEvent(new Event('storage_updated'));
  },
  updateMarathon: async (marathon: Marathon) => {
    await setDoc(doc(db, 'marathons', marathon.id), marathon);
    window.dispatchEvent(new Event('storage_updated'));
  },

  getMarathonGroups: async (): Promise<MarathonGroup[]> => {
    try {
      const querySnapshot = await withTimeout(getDocs(collection(db, 'marathonGroups')));
      return querySnapshot.docs.map(doc => doc.data() as MarathonGroup);
    } catch (error) {
      console.error('Error fetching marathon groups:', error);
      return [];
    }
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
    
    // Update marathon document with new group ID
    const marathonRef = doc(db, 'marathons', marathonId);
    const marathonSnap = await getDoc(marathonRef);
    if (marathonSnap.exists()) {
      const marathon = marathonSnap.data() as Marathon;
      await setDoc(marathonRef, {
        ...marathon,
        groupIds: [...(marathon.groupIds || []), id]
      });
    }
    
    window.dispatchEvent(new Event('storage_updated'));
    return newGroup;
  },
  updateMarathonGroup: async (group: MarathonGroup) => {
    await setDoc(doc(db, 'marathonGroups', group.id), group);
    window.dispatchEvent(new Event('storage_updated'));
  },
  deleteMarathonGroup: async (groupId: string) => {
    await deleteDoc(doc(db, 'marathonGroups', groupId));
    window.dispatchEvent(new Event('storage_updated'));
  },

  getMarathonActivityPoints: async (): Promise<MarathonActivityPoints[]> => {
    try {
      const querySnapshot = await withTimeout(getDocs(collection(db, 'marathonActivityPoints')));
      return querySnapshot.docs.map(doc => doc.data() as MarathonActivityPoints);
    } catch (error) {
      console.error('Error fetching marathon points:', error);
      return [];
    }
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
    window.dispatchEvent(new Event('storage_updated'));
  },
  deleteMarathonActivityPoint: async (id: string) => {
    await deleteDoc(doc(db, 'marathonActivityPoints', id));
    window.dispatchEvent(new Event('storage_updated'));
  },

  // Special Follow-up Methods
  getServantAttendance: async (): Promise<ServantAttendance[]> => {
    try {
      const querySnapshot = await withTimeout(getDocs(collection(db, 'servantAttendance')));
      return querySnapshot.docs.map(doc => doc.data() as ServantAttendance);
    } catch (error) {
      console.error('Error fetching servant attendance:', error);
      return [];
    }
  },
  saveServantAttendance: async (records: ServantAttendance[]) => {
    for (const r of records) {
      await setDoc(doc(db, 'servantAttendance', r.id), r);
    }
    window.dispatchEvent(new Event('storage_updated'));
    return true;
  },
  getVisitations: async (): Promise<Visitation[]> => {
    try {
      const querySnapshot = await withTimeout(getDocs(collection(db, 'visitations')));
      return querySnapshot.docs.map(doc => doc.data() as Visitation);
    } catch (error) {
      console.error('Error fetching visitations:', error);
      return [];
    }
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
    window.dispatchEvent(new Event('storage_updated'));
  },
  deleteVisitation: async (id: string) => {
    await deleteDoc(doc(db, 'visitations', id));
    window.dispatchEvent(new Event('storage_updated'));
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
    window.dispatchEvent(new Event('sync_started'));
    try {
      // Force fetch the most critical data from server to refresh cache
      await getDocFromServer(doc(db, 'config', 'main'));
      await getDocsFromServer(collection(db, 'youth'));
      await getDocsFromServer(collection(db, 'attendance'));
      
      localStorage.setItem('church_db_last_sync_v3', new Date().toLocaleString('ar-EG'));
      window.dispatchEvent(new Event('storage_updated'));
      window.dispatchEvent(new Event('sync_ended'));
      return { success: true };
    } catch (error) {
      console.error('Sync error:', error);
      window.dispatchEvent(new Event('sync_error'));
      return { success: false };
    }
  }
};
