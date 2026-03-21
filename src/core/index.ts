/**
 * Core Module Index
 * Exports all AGI cognitive components
 */

export {
  EventBus,
  EventDispatcher,
  Disposable,
  DisposeMode,
  NexusTask,
  NexusTaskHeap,
  NexusPatch,
  NexusArchitecturalLinter,
  NexusDiagnosticReporter,
  NexusCompilerHost
} from './nexus_core';

export { EpisodicMemory } from './episodic_memory';
export type { Episode, EpisodicMemoryConfig } from './episodic_memory';

export { SelfAwareness } from './self_awareness';
export type { SelfModel, IntrospectionResult, MetacognitionConfig } from './self_awareness';

export { AGIKernel } from './agi_kernel';
export type { AGIKernelConfig, AGIState } from './agi_kernel';

export { utils } from './utils';
