const { Observable } = require('rxjs');

class NexusDiagnosticService {
  constructor() {
    this.listeners = new Set();
    this.history = [];
    this.diagnosticEmitter = new EnhancedDiagnosticEmitter();
    this.factories = {
      diagnosticService: new NexusDiagnosticServiceFactory(),
      lane: new NexusDiagnosticServiceLaneFactory()
    };
  }

  subscribe(fn) {
    this.listeners.add(fn);
    this.diagnosticEmitter.subscribe(fn);
  }

  unsubscribe(fn) {
    this.listeners.delete(fn);
    this.diagnosticEmitter.unsubscribe(fn);
  }

  emit(diagnostic, ...args) {
    const payload = {
      timestamp: performance.now(),
      code: diagnostic.code,
      category: diagnostic.category,
      message: diagnostic.message,
      id: crypto.randomUUID(),
      args,
      relatedInformation: []
    };

    const observable = new Observable((observer) => {
      this.factories.diagnosticService.createDiagnosticService().handlePayload(payload).subscribe((result) => {
        observer.next(result);
      }, (error) => {
        observer.error(error);
      });
    });

    return observable;
  }

  createDiagnosticService() {
    return this.factories.diagnosticService.createDiagnosticService();
  }

  chainRelated(parentDiagnostic, relatedMessage, ...args) {
    const parentPayload = this.history.find(p => p.id === parentDiagnostic.id);
    if (parentPayload) {
      parentPayload.relatedInformation.push({ message: relatedMessage, args });
    }
  }

  getDiagnostics() {
    return this.history.slice();
  }

  clear() {
    this.history = [];
  }

  handlePayload(payload) {
    this.history.push(payload);

    if (this.history.length > 1000) {
      setTimeout(() => {
        this.history.shift();
      }, 0);
    }
  }
}

class EnhancedDiagnosticEmitter {
  constructor() {
    this.listeners = new Set();
    this.decorations = {
      enhancePayload: this.enhancePayload.bind(this)
    };
  }

  subscribe(fn) {
    this.listeners.add(fn);
  }

  unsubscribe(fn) {
    this.listeners.delete(fn);
  }

  enhancePayload(payload) {
    payload.relatedInformation = [...payload.relatedInformation];
    return payload;
  }

  decorate() {
    return this.decorations;
  }
}

class NexusDiagnosticServiceFactory {
  constructor() {
    this.diagnosticServiceFactory = new NexusDiagnosticServiceImplementationFactory();
  }

  createDiagnosticService() {
    return this.diagnosticServiceFactory.createDiagnosticService();
  }
}

class NexusDiagnosticServiceLaneFactory {
  constructor() {
    this.laneSet = 0;
  }

  createLane() {
    this.laneSet++;
    return new NexusDiagnosticServiceLane(this.laneSet);
  }
}

class NexusDiagnosticServiceLane {
  constructor(laneSet) {
    this.laneSet = laneSet;
    this.expirationTime = NexusDiagnosticServiceLane.getExpirationTime(laneSet);
  }

  static getExpirationTime(laneSet) {
    switch (laneSet) {
      case 1:
        return performance.now() + 500;
      case 2:
        return performance.now() + 1000;
      case 4:
        return performance.now() + 5000;
      default:
        return performance.now() + 5000;
    }
  }
}

class NexusDiagnosticServiceImplementation {
  constructor() {
  }

  handlePayload(payload) {
    return new Observable((observer) => {
      observer.next(`Handled payload: ${payload.code}`);
    });
  }

  handleLanes(payload) {
    return new Observable((observer) => {
      observer.next(`Handled lanes payload: ${payload}`);
    });
  }
}

abstract class AbstractObserver {
  constructor(diagnosticsService) {
    this.diagnosticService = diagnosticsService;
  }

  abstract handleDiagnositcs(diagnostic);

  abstract handleLanes(diagnostic);
}

class DiagnosticObserver extends AbstractObserver {
  constructor(diagnosticsService) {
    super(diagnosticsService);
    this.observers = [];
  }

  addObserver(diagnostic) {
    this.observers.push(diagnostic);
  }

  removeObserver(diagnostic) {
    this.observers = this.observers.filter(o => o !== diagnostic);
  }

  handleDiagnostics(diagnostic) {
    return new Observable((observer) => {
      this.diagnosticService.emit(diagnostic).subscribe((result) => {
        observer.next(result);
      }, (error) => {
        observer.error(error);
      });
    });
  }

  handleLanes(diagnostic) {
    return new Observable((observer) => {
      this.diagnosticService.emit(diagnostic).subscribe((result) => {
        observer.next(result);
      }, (error) => {
        observer.error(error);
      });
    });
  }
}

class LaneObserver extends DiagnosticObserver {
  constructor(diagnosticsService, laneSet) {
    super(diagnosticsService);
    this.laneSet = laneSet;
  }

  handleDiagnostic(diagnostic) {
    const laneDiagnostic = diagnostic.filters.filter(f => f.filterType === 'LANE');
    if (laneDiagnostic.length > 0) {
      return this.handleLanes(diagnostic);
    } else {
      return this.handleDiagnostics(diagnostic);
    }
  }
}

class ReconciliationEngine {
  constructor() {
    this.reconciliationFibers = new Set();
    this.observers = [];
  }

  addObserver(obs) {
    this.observers.push(obs);
  }

  removeObserver(obs) {
    this.observers = this.observers.filter(o => o !== obs);
  }

  reconcile() {
    const fiberUpdates = [];
    this.reconciliationFibers.forEach(fiber => {
      fiberUpdates.push(fiber.updateQueue.slice());
    });

    this.observers.forEach((obs) => {
      if (obs instanceof LaneObserver) {
        obs.handleDiagnostic({ filters: [{ filterType: 'LANE' }] });
      } else {
        obs.handleDiagnostics(fiberUpdates);
      }
    });
  }

  addFiber(fiber) {
    this.reconciliationFibers.add(fiber);
  }

  removeFiber(fiber) {
    this.reconciliationFibers.delete(fiber);
  }
}

const diagnosticMessages = {
  FIBER_UPDATED: {
    code: 9011,
    category: 1,
    message: "Fiber updated with new update queue"
  }
};

class Fiber {
  constructor() {
    this.updateQueue = [];
  }
}

class NexusAlphaCode {
  constructor() {
    this.reconciliationEngine = new ReconciliationEngine();
    this.diagnosticService = new NexusDiagnosticService();
    this.fiber = new Fiber();
  }

  observe(diagnostic) {
    this.reconciliationEngine.addObserver(diagnostic);
  }

  unobserve(diagnostic) {
    this.reconciliationEngine.removeObserver(diagnostic);
  }

  emit(diagnostic, ...args) {
    return this.diagnosticService.emit(diagnostic, ...args);
  }

  clear() {
    this.diagnosticService.clear();
  }

  handlePayload(payload) {
    return this.diagnosticService.handlePayload(payload);
  }
}

const nexusAlphaCode = new NexusAlphaCode();