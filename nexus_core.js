// nexus_core.js
import { EventDispatcher } from './EventDispatcher';
import { Observable } from './Observable';
import { Subject } from './Subject';
import { ReconfigurationStrategy } from './ReconfigurationStrategy';
import { ReconfigurationDecoratorStrategy } from './ReconfigurationDecoratorStrategy';
import { ReconfigurationFilterStrategy } from './ReconfigurationFilterStrategy';
import { SymbioticFiberManagerFactory } from './SymbioticFiberManagerFactory';
import { SymbioticFiberManager } from './SymbioticFiberManager';
import { SymbioticFiberManagerPool } from './SymbioticFiberManagerPool';

import { SubjectWrapper } from './Dependencies';

class DiagnosticServices extends EventDispatcher {
  constructor(nexus) {
    super();
    this.observers = [];
    this.diagnosticServices = [];
    this.nexus = nexus;
    this._diagnosticSubject = new SubjectWrapper();
  }

  subscribe(diagnosticService) {
    this.observers.push(diagnosticService);
    this._diagnosticSubject.subscribe(diagnosticService.handleDiagnostic.bind(diagnosticService));
  }

  unsubscribe(diagnosticService) {
    const index = this.observers.indexOf(diagnosticService);
    if (index !== -1) {
      this.observers.splice(index, 1);
      this._diagnosticSubject.unsubscribe(diagnosticService.handleDiagnostic.bind(diagnosticService));
    }
  }

  emit(diagnostic, ...args) {
    this._diagnosticSubject.emit(JSON.stringify(diagnostic));
  }

  getAllDiagnostics() {
    return [...this.diagnosticServices];
  }

  async getDiagnosticEvents() {
    const events$ = this._diagnosticSubject.subject.pipe(map((event) => JSON.parse(event)));
    return events$;
  }
}

class DiagnosticStrategyFactory {
  static createStrategy(strategyType) {
    switch (strategyType) {
      case 'decorator':
        return new ReconfigurationDecoratorStrategy();
      case 'filter':
        return new ReconfigurationFilterStrategy();
      default:
        throw new Error('Invalid strategy type');
    }
  }
}

class DiagnosticDispatcher extends EventDispatcher {
  constructor(nexus) {
    super();
    this.nexus = nexus;
  }

  addObserver(diagnosticService) {
    this.nexus.diagnosticServices.subscribe(diagnosticService);
  }

  removeObserver(diagnosticService) {
    this.nexus.diagnosticServices.unsubscribe(diagnosticService);
  }
}

class ReconciliationObserver extends Observable {
  constructor(diagnosticServices) {
    super();
    this.diagnosticServices = diagnosticServices;
  }

  handleDiagnostic(diagnostic) {
    this.diagnosticServices.reconcile(diagnostic);
  }

  addObserver(fn) {
    this.observers.push(fn);
  }

  removeObserver(fn) {
    const index = this.observers.indexOf(fn);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }
}

class SymbioticFiberManagerFactory {
  constructor(nexus, fiberManagerPool) {
    this.nexus = nexus;
    this.fiberManagerPool = fiberManagerPool;
  }

  async createFiberManager(fiber) {
    const existingFiberManager = this.fiberManagerPool.getFiberManager(fiber);
    if (existingFiberManager) {
      return existingFiberManager;
    }
    const fiberManager = SymbioticFiberManager.createManager(fiber);
    await fiberManager.addFibers();
    this.fiberManagerPool.addFiberManager(fiber, fiberManager);
    this.nexus.fiberManagers.push(fiberManager);
    return fiberManager;
  }

  async deleteFiberManager(fiber) {
    const index = this.nexus.fiberManagers.findIndex(manager => manager.fiber === fiber);
    if (index !== -1) {
      this.nexus.fiberManagers.splice(index, 1);
    }
  }
}

class SymbioticFiberManager {
  static createManager(fiber) {
    if (SymbioticFiberManagerPool.hasFiberManager(fiber)) {
      return SymbioticFiberManagerPool.getFiberManager(fiber);
    }
    return new SymbioticFiberManager(fiber);
  }

  constructor(fiber) {
    this.fibers = new Set();
    this.pendingFibers = new Set();
  }

  async addFibers() {
    await Promise.all(this.pendingFibers);
    this.fibers.forEach(fiber => this.addFiber(fiber));
  }

  addFiber(fiber) {
    this.fibers.add(fiber);
  }

  removeFiber(fiber) {
    this.fibers.delete(fiber);
  }

  getFibers() {
    return Array.from(this.fibers);
  }
}

class SymbioticFiberManagerPool {
  constructor() {
    this.fibersToManagers = new Map();
  }

  hasFiberManager(fiber) {
    return this.fibersToManagers.has(fiber);
  }

  getFiberManager(fiber) {
    return this.fibersToManagers.get(fiber);
  }

  addFiberManager(fiber, fiberManager) {
    this.fibersToManagers.set(fiber, fiberManager);
  }
}

class SubjectWrapper extends Subject {
  constructor(defaultData = null) {
    super(defaultData);
    this.observers = [];
  }

  subscribe(fn) {
    this.observers.push(fn);
  }

  unsubscribe(fn) {
    const index = this.observers.indexOf(fn);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  emit(event) {
    this.next(event);
  }
}

export { DiagnosticServices, DiagnosticStrategyFactory, DiagnosticDispatcher, ReconciliationObserver, SymbioticFiberManagerFactory, SymbioticFiberManager, SymbioticFiberManagerPool };

export {
  SubjectWrapper,
};

class Nexus extends EventDispatcher {
  constructor() {
    super();
    this.fiberManagers = [];
    this._diagnosticServices = new DiagnosticServices(this);
  }

  getDiagnosticServices() {
    return this._diagnosticServices;
  }

  getFiberManagers() {
    return this.fiberManagers;
  }

  async createFiberManager(fiber) {
    return await this.SymbioticFiberManagerFactory.createFiberManager(fiber);
  }

  async deleteFiberManager(fiber) {
    await this.SymbioticFiberManagerFactory.deleteFiberManager(fiber);
  }
}

export { Nexus };