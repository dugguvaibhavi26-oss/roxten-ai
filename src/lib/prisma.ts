import { db } from './firebase';
import { collection, doc, getDoc, getDocs, query, where, limit as fbLimit, orderBy as fbOrderBy, setDoc, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const generateId = () => uuidv4();

class FirestoreAdapter {
  constructor(public collectionName: string) {}

  private async parseWhere(qRef: any, whereObj: any) {
    let constraints: any[] = [];
    
    // Auto-inject Multi-Tenant Isolation
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      
      if (this.collectionName === 'companies') {
        const userId = cookieStore.get('userId')?.value;
        if (userId) constraints.push(where('userId', '==', userId));
      } else if (this.collectionName !== 'users' && this.collectionName !== 'employeeTemplates' && this.collectionName !== 'voiceProfiles') {
        const businessId = cookieStore.get('businessId')?.value;
        if (businessId) {
           // Allow 'system' businessId for global system intelligence
           // But normally filter by the active business ID
           // Actually, some endpoints use businessId: 'system', so we shouldn't strictly enforce it if whereObj already specifies 'system'
           if (!whereObj || whereObj.businessId !== 'system') {
             constraints.push(where('businessId', '==', businessId));
           }
        }
      }
    } catch (e) {
      // Ignored if not in a server context
    }

    if (!whereObj) return constraints;
    
    for (const [k, v] of Object.entries(whereObj)) {
      if (typeof v !== 'object') {
        constraints.push(where(k, '==', v));
      } else if (v !== null) {
        const vObj = v as any;
        if (vObj.hasSome) {
          constraints.push(where(k, 'array-contains-any', vObj.hasSome));
        }
        if (vObj.in) {
          constraints.push(where(k, 'in', vObj.in));
        }
      }
    }
    return constraints;
  }

  async findFirst(args?: any) {
    try {
      const qRef = collection(db, this.collectionName);
      const constraints = await this.parseWhere(qRef, args?.where);
      const q = query(qRef, ...constraints, fbLimit(1));
      
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (e) {
      console.error(`Firestore findFirst error on ${this.collectionName}:`, e);
      return null;
    }
  }

  async findUnique(args: any) {
    try {
      if (args?.where?.id) {
        const docRef = doc(db, this.collectionName, args.where.id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        
        // Basic protection for findUnique
        const data = docSnap.data();
        try {
          const { cookies } = await import('next/headers');
          const cookieStore = await cookies();
          if (this.collectionName === 'companies' && data.userId && data.userId !== cookieStore.get('userId')?.value) return null;
          if (this.collectionName !== 'companies' && this.collectionName !== 'users' && this.collectionName !== 'employeeTemplates' && this.collectionName !== 'voiceProfiles' && data.businessId && data.businessId !== 'system' && data.businessId !== cookieStore.get('businessId')?.value) return null;
        } catch(e) {}

        return { id: docSnap.id, ...data };
      }
      return this.findFirst(args);
    } catch (e) {
      console.error(`Firestore findUnique error on ${this.collectionName}:`, e);
      return null;
    }
  }

  async findMany(args?: any) {
    try {
      const qRef = collection(db, this.collectionName);
      const constraints = await this.parseWhere(qRef, args?.where);
      
      if (args?.orderBy) {
        for (const [k, v] of Object.entries(args.orderBy)) {
          if (typeof v === 'string') {
            constraints.push(fbOrderBy(k, v as 'asc' | 'desc'));
          }
        }
      }
      
      if (args?.take) constraints.push(fbLimit(args.take));
      
      const q = query(qRef, ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error(`Firestore findMany error on ${this.collectionName}:`, e);
      return [];
    }
  }

  async create(args: any) {
    try {
      const id = args.data.id || generateId();
      const data = { ...args.data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      delete data.id;

      // Auto-inject Multi-Tenant IDs
      try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        
        if (this.collectionName === 'companies') {
          data.userId = data.userId || cookieStore.get('userId')?.value;
        } else if (this.collectionName !== 'users' && this.collectionName !== 'employeeTemplates' && this.collectionName !== 'voiceProfiles') {
          data.businessId = data.businessId || cookieStore.get('businessId')?.value;
        }
      } catch (e) {}
      
      Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
      
      const docRef = doc(db, this.collectionName, id);
      await setDoc(docRef, data);
      return { id, ...data };
    } catch (e) {
      console.error(`Firestore create error on ${this.collectionName}:`, e);
      return null;
    }
  }
  
  async createMany(args: any) {
    try {
      const batch = writeBatch(db);
      
      let userId: string | undefined;
      let businessId: string | undefined;
      try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        userId = cookieStore.get('userId')?.value;
        businessId = cookieStore.get('businessId')?.value;
      } catch (e) {}

      for (const item of args.data) {
        const id = item.id || generateId();
        const data = { ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        delete data.id;
        
        if (this.collectionName === 'companies') data.userId = data.userId || userId;
        else if (this.collectionName !== 'users' && this.collectionName !== 'employeeTemplates' && this.collectionName !== 'voiceProfiles') data.businessId = data.businessId || businessId;

        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        
        const docRef = doc(db, this.collectionName, id);
        batch.set(docRef, data);
      }
      await batch.commit();
      return { count: args.data.length };
    } catch (e) {
      console.error(`Firestore createMany error on ${this.collectionName}:`, e);
      return { count: 0 };
    }
  }

  async update(args: any) {
    try {
      const id = args.where.id;
      const data = { ...args.data, updatedAt: new Date().toISOString() };
      Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
      
      const docRef = doc(db, this.collectionName, id);
      await setDoc(docRef, data, { merge: true });
      
      const docSnap = await getDoc(docRef);
      return { id, ...docSnap.data() };
    } catch (e) {
      console.error(`Firestore update error on ${this.collectionName}:`, e);
      return null;
    }
  }

  async delete(args: any) {
    try {
      const id = args.where.id;
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      return { id };
    } catch (e) {
      console.error(`Firestore delete error on ${this.collectionName}:`, e);
      return null;
    }
  }
}

// Map Prisma model names to requested Firestore collections
const prismaBase: Record<string, FirestoreAdapter> = {
  business: new FirestoreAdapter('companies'),
  department: new FirestoreAdapter('departments'),
  knowledgeDocument: new FirestoreAdapter('knowledgeBase'),
  employee: new FirestoreAdapter('employees'),
  employeeAnalytics: new FirestoreAdapter('employeeAnalytics'),
  activity: new FirestoreAdapter('activities'),
  activityEvent: new FirestoreAdapter('timeline'),
  businessKnowledge: new FirestoreAdapter('knowledgeBase'),
  memory: new FirestoreAdapter('employeeMemory'),
  task: new FirestoreAdapter('tasks'),
  businessTimelineEvent: new FirestoreAdapter('timeline'),
  businessInsight: new FirestoreAdapter('companyBrain'),
  gamificationProfile: new FirestoreAdapter('promotions'),
  voice: new FirestoreAdapter('voiceProfiles'),
  employeeTemplate: new FirestoreAdapter('employeeTemplates'),
  testingSession: new FirestoreAdapter('testingSessions'),
};

const prisma: any = new Proxy(prismaBase, {
  get(target: any, prop: string) {
    if (prop in target) {
      return target[prop];
    }
    // Automatically create and cache an adapter for unknown models
    target[prop] = new FirestoreAdapter(prop);
    return target[prop];
  }
});

export default prisma;
