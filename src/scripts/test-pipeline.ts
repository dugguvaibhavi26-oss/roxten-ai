
import { JarvisCore } from '../core/kernel/JarvisCore';
import { IntentEngine } from '../core/engines/IntentEngine';
import { MissionPlanner } from '../core/engines/MissionPlanner';
import { MissionScheduler } from '../core/engines/MissionScheduler';
import { DecisionEngine } from '../core/engines/DecisionEngine';
import { WorkforceManager } from '../core/engines/WorkforceManager';
import { DepartmentRuntime } from '../core/runtime/DepartmentRuntime';
import { ExecutiveEngine } from '../core/engines/ExecutiveEngine';
import { EventPipeline } from '../core/messaging/EventPipeline';

async function test() {
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

  pipe.subscribe('*', e => {
    console.log(e.type + ' -> ' + e.intent + ' (' + e.sender + ')');
    if (e.type === 'MISSION_COMPLETED') {
      process.exit(0);
    }
  });

  await core.boot();
  await core.dispatchCommand('Launch a new product nationwide');
}

test();
