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

class ContextManagerFactory {
  static createContextManager(contextType) {
    switch (contextType) {
      case 'decorator':
        return new ContextDelegatingDecorator(contextType);
      case 'filter':
        return new ContextDelegatingFilter(contextType);
      case 'async':
        return new asyncContextManager();
      default:
        throw new Error('Invalid context manager type');
    }
  }
}

class DiagnosticServices extends EventDispatcher {
  constructor(nexus, contextManagerFactory) {
    super();
    this.observers = [];
    this.diagnosticServices = [];
    this.nexus = nexus;
    this._diagnosticSubject = new SubjectWrapper();
    this.contextManagerFactory = contextManagerFactory;
    this.contextManagerPool = {};
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

  getContextManager(contextId) {
    if (!this.contextManagerPool[contextId]) {
      const contextManager = this.contextManagerFactory.createContextManager(contextId);
      this.contextManagerPool[contextId] = contextManager;
    }
    return this.contextManagerPool[contextId];
  }
}

class ContextDelegatingDecorator extends EventDispatcher {
  constructor(contextType) {
    super();
    this.contextType = contextType;
  }

  handleDiagnostic(diagnostic) {
    this.next(diagnostic);
  }
}

class ContextDelegatingFilter extends EventDispatcher {
  constructor(contextType) {
    super();
    this.contextType = contextType;
  }

  handleDiagnostic(diagnostic) {
    if (this.contextType === 'filtered') {
      diagnostic.filtered = true;
    }
    this.next(diagnostic);
  }
}

class asyncContextManager extends EventDispatcher {
  async handleDiagnostic(diagnostic) {
    try {
      const result = await this.doAsyncOperation(diagnostic.metadata);
      diagnostic.result = result;
    } catch (error) {
      diagnostic.error = error;
    }
    this.next(diagnostic);
  }

  doAsyncOperation(metadata) {
    return Promise.resolve(metadata);
  }
}

class DiagnosticHandler extends EventDispatcher {
  handleDiagnostic(diagnostic) {
    this.observers.forEach(observer => observer.handleDiagnostic(diagnostic));
  }
}

class SymbioticFiberManagerFactory {
  constructor(nexus, contextManagerFactory) {
    this.nexus = nexus;
    this.contextManagerFactory = contextManagerFactory;
  }

  async createFiberManager(fiber) {
    const existingFiberManager = SymbioticFiberManagerPool.getFiberManager(fiber);
    if (existingFiberManager) {
      return existingFiberManager;
    }
    const fiberManager = SymbioticFiberManager.createManager(fiber);
    await fiberManager.addFibers();
    SymbioticFiberManagerPool.addFiberManager(fiber, fiberManager);
    this.nexus.fiberManagers.push(fiberManager);
    return fiberManager;
  }
}

class SymbioticFiberManager {
  static createManager(fiber) {
    if (SymbioticFiberManagerPool.hasFiberManager(fiber)) {
      return SymbioticFiberManagerPool.getFiberManager(fiber);
    }
    return new SymbioticFiberManager(fiber);
  }

  async addFibers() {
    await Promise.all(this.pendingFibers);
    this.fibers.forEach(fiber => this.addFiber(fiber));
  }

  addFiber(fiber) {
    this.fibers.add(fiber);
  }

  getFibers() {
    return Array.from(this.fibers);
  }
}

class SymbioticFiberManagerPool {
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

class Nexus extends EventDispatcher {
  constructor() {
    super();
    this.fiberManagers = [];
    this._diagnosticServices = new DiagnosticServices(this, new ContextManagerFactory());
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
}

export { DiagnosticServices, DiagnosticHandler, SymbioticFiberManagerFactory, SymbioticFiberManager, SymbioticFiberManagerPool, Nexus };