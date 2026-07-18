import prisma from '@/lib/prisma';

export class WorkforceService {
  /**
   * Returns only fully initialized and deployed employees for a business.
   * This acts as the single source of truth for all workforce metrics.
   */
  static async getDeployedEmployees(businessId: string) {
    const employees = await prisma.employee.findMany({
      where: {
        businessId,
        isDeployed: true,
        isActive: true
      }
    });
    return employees;
  }

  /**
   * Returns the assembled Galaxy graph (Business -> Departments -> Employees)
   * used by Active Directory, Galaxy View, etc.
   */
  static async getGalaxy(businessId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) return null;

    const departments = await prisma.department.findMany({
      where: { businessId }
    });

    // Only fetch fully deployed employees
    const employees = await this.getDeployedEmployees(businessId);
    
    // Fetch all active tasks to join with employees
    const activeTasks = await prisma.task.findMany({
      where: {
        businessId,
        status: 'IN_PROGRESS'
      }
    });

    // Attach tasks to employees
    const employeesWithTasks = employees.map((emp: any) => ({
      ...emp,
      tasks: activeTasks.filter((t: any) => t.employeeId === emp.id)
    }));

    // Assemble departments
    const assembledDepartments = departments.map((dept: any) => ({
      ...dept,
      employees: employeesWithTasks.filter((emp: any) => emp.departmentId === dept.id)
    }));

    // Assemble floaters (employees with no department or unmatched department)
    const deptIds = new Set(departments.map((d: any) => d.id));
    const floaters = employeesWithTasks.filter((emp: any) => !emp.departmentId || !deptIds.has(emp.departmentId));

    return {
      ...business,
      departments: assembledDepartments,
      employees: floaters
    };
  }

  static async getPulseMetrics(businessId: string) {
    const employees = await this.getDeployedEmployees(businessId);
    
    // Fetch real metrics
    const [activeTasks, completedTasks, voiceSessions] = await Promise.all([
      prisma.task.findMany({
        where: { businessId, status: { in: ['PENDING', 'IN_PROGRESS'] } }
      }),
      prisma.task.findMany({
        where: { businessId, status: 'COMPLETED' }
      }),
      prisma.activity.findMany({
        where: { businessId, source: 'voice_session' }
      })
    ]);

    const activeEmployeesCount = employees.length;
    const runningTasksCount = activeTasks.length;

    // A running task in IN_PROGRESS means the employee is working/speaking
    const workingEmployees = activeTasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
    const idleEmployees = Math.max(0, activeEmployeesCount - workingEmployees);

    return {
      activeEmployees: activeEmployeesCount,
      tasksCount: runningTasksCount, // Assigned Tasks
      completedTasks: completedTasks.length, // Completed Tasks
      voiceSessions: voiceSessions.length, // Total Voice Sessions
      workingEmployees,
      idleEmployees,
      averageRuntimeHealth: 100, // Placeholder for runtime health checks
      averageKnowledgeConfidence: 95 // Placeholder for RAG confidence
    };
  }
}
