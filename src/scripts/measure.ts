
import { JarvisCore } from '../core/kernel/JarvisCore';
import { IntentEngine } from '../core/engines/IntentEngine';
import { MissionPlanner } from '../core/engines/MissionPlanner';
import { MissionScheduler } from '../core/engines/MissionScheduler';
import { DecisionEngine } from '../core/engines/DecisionEngine';
import { WorkforceManager } from '../core/engines/WorkforceManager';
import { DepartmentRuntime } from '../core/runtime/DepartmentRuntime';
import { ExecutiveEngine } from '../core/engines/ExecutiveEngine';
import { EventPipeline } from '../core/messaging/EventPipeline';
import { performance } from 'perf_hooks';

async function measure() {
  const startBoot = performance.now();
  const core = JarvisCore.getInstance();
  const pipe = EventPipeline.getInstance();

  core.registerEngine(new IntentEngine());
  core.registerEngine(new MissionPlanner());
  core.registerEngine(new MissionScheduler());
  core.registerEngine(new DecisionEngine());
  core.registerEngine(new WorkforceManager());
  core.registerEngine(new DepartmentRuntime('Marketing'));
  core.registerEngine(new DepartmentRuntime('Finance'));
  core.registerEngine(new DepartmentRuntime('Creative'));
  core.registerEngine(new DepartmentRuntime('Sales'));
  core.registerEngine(new ExecutiveEngine());

  const trace: any[] = [];
  pipe.subscribe('*', e => {
    trace.push(e.type + ' -> ' + e.intent + ' (' + e.sender + ')');
    if (e.type === 'MISSION_COMPLETED') {
      const endMission = performance.now();
      console.log('--- EVENT TRACE ---');
      console.log(trace.join('\n'));
      console.log('--- METRICS ---');
      console.log('Startup Time:', (endBoot - startBoot).toFixed(2), 'ms');
      console.log('Mission Execution Time:', (endMission - startMission).toFixed(2), 'ms');
      console.log('Memory Usage (Heap Used):', (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2), 'MB');
      process.exit(0);
    }
  });

  await core.boot();
  const endBoot = performance.now();
  
  const startMission = performance.now();
  await core.dispatchCommand('Launch SpiceNest nationwide');
}

measure();
