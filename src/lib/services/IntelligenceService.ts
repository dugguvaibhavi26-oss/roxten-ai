import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export class IntelligenceService {
  /**
   * Fetch all structured intelligence nodes for the Company Brain
   */
  static async getCompanyBrain(businessId: string) {
    const q = query(collection(db, 'companyBrain'), where('businessId', '==', businessId));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    return results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  /**
   * Fetch all structured documents and facts for the Knowledge Base
   */
  static async getKnowledgeBase(businessId: string) {
    const q = query(collection(db, 'knowledgeBase'), where('businessId', '==', businessId));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    return results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  /**
   * Fetch specific memories injected into an AI Employee
   */
  static async getEmployeeMemories(businessId: string, employeeId: string) {
    const q = query(collection(db, 'employeeMemory'), where('businessId', '==', businessId), where('employeeId', '==', employeeId));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    return results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  /**
   * Fetch persistent intelligence reports
   */
  static async getReports(businessId: string) {
    const q = query(collection(db, 'reports'), where('businessId', '==', businessId));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    return results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  /**
   * Add a new memory for an AI Employee
   */
  static async addEmployeeMemory(businessId: string, employeeId: string, topic: string, content: string) {
    return addDoc(collection(db, 'employeeMemory'), {
      businessId,
      employeeId,
      topic,
      content,
      createdAt: new Date().toISOString()
    });
  }
}
