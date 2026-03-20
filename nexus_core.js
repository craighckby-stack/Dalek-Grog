const { Observable } = require('rxjs');
const { console } = require('console');

class NexusDiagnosticService {
  constructor() {
    this.listeners = new Set();
    this.history = [];
    this.diagnosticEmitter = new EnhancedDiagnosticEmitter();
    this.factories = {
      diagnosticService: new NexusDiagnosticServiceFactory(),
      lane: new NexusDiagnosticServiceLaneFactory()
    };
    this.reconciliationEngine = new ReconciliationEngine();
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
        console.log(`Handled payload: ${result}`);
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
    const interval = this.getRandomExpirationTimeInterval();
    this.expirationTime = performance.now() + interval;
  }

  static getExpirationTime(laneSet) {
    const interval = this.getRandomExpirationTimeInterval();
    return performance.now() + interval;
  }

  static getRandomExpirationTimeInterval() {
    const interval = Math.floor(Math.random() * 2);
    if (interval === 0) {
      return 500;
    } else {
      return 1000;
    }
  }
}

class DiagnosticObserver {
  constructor(diagnosticsService) {
    this.diagnosticService = diagnosticsService;
    this.observers = [];
    this.laneSet = null;
  }

  addObserver(diagnostic) {
    this.observers.push(diagnostic);
  }

  removeObserver(diagnostic) {
    this.observers = this.observers.filter(o => o !== diagnostic);
  }

  handleDiagnostic(diagnostic) {
    const laneDiagnostic = diagnostic.filters.filter(f => f.filterType === 'LANE');
    if (laneDiagnostic.length > 0) {
      return this.handleLanes(diagnostic);
    } else {
      return this.handleDiagnostics(diagnostic);
    }
  }

  handleDiagnostics(diagnostic) {
    const observable = new Observable((observer) => {
      this.diagnosticService.handlePayload(diagnostic).subscribe((result) => {
        observer.next(result);
      }, (error) => {
        observer.error(error);
      });
    });
    return observable;
  }

  handleLanes(diagnostic) {
    const observable = new Observable((observer) => {
      this.diagnosticService.emit(diagnostic).subscribe((result) => {
        observer.next(result);
      }, (error) => {
        observer.error(error);
      });
    });
    return observable;
  }
}

class ReconciliationEngine {
  constructor() {
    this.reconciliationFibers = new Set();
    this.observers = [];
    this.laneObserveMapping = new Map();
    this.diagnosticsService = null;
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
      if (obs instanceof DiagnosticObserver) {
        obs.handleDiagnostic({ filters: [{ filterType: 'LANE' }] });
      }
    });
  }

  addFiber(fiber) {
    this.reconciliationFibers.add(fiber);
  }

  removeFiber(fiber) {
    this.reconciliationFibers.delete(fiber);
  }

  setDiagnosticsService(diagnosticsService) {
    this.diagnosticsService = diagnosticsService;
  }
}

class Fiber {
  constructor() {
    this.updateQueue = [];
  }

  mutate() {
    // Mutate the fiber
  }
}

class NexusAlphaCode {
  constructor() {
    this.reconciliationEngine = new ReconciliationEngine();
    this.diagnosticService = new NexusDiagnosticService();
    this.fiber = new Fiber();
  }

  observe(diagnostic) {
    const observer = new DiagnosticObserver(this.diagnosticService);
    observer.addObserver(diagnostic);
    this.reconciliationEngine.addObserver(observer);
  }

  unobserve(diagnostic) {
    this.reconciliationEngine.observers = this.reconciliationEngine.observers.filter(o => o.diagnosticService !== this.diagnosticService);
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

  getDiagnostics() {
    return this.diagnosticService.getDiagnostics();
  }
}

const nexusAlphaCode = new NexusAlphaCode();

const diagnosticMessages = {
  FIBER_UPDATED: {
    code: 9011,
    category: 1,
    message: "Fiber updated with new update queue"
  }
};

class AlphaCodePipeline {
  constructor(nexusAlphaCode) {
    this.nexusAlphaCode = nexusAlphaCode;
    this.pipelineFibers = new Set();
  }

  addFiber(fiber) {
    this.pipelineFibers.add(fiber);
  }

  removeFiber(fiber) {
    this.pipelineFibers.delete(fiber);
  }

  emit(diagnostic, ...args) {
    return this.nexusAlphaCode.emit(diagnostic, ...args);
  }

  handlePayload(payload) {
    return this.nexusAlphaCode.handlePayload(payload);
  }
}

const alphaCodePipeline = new AlphaCodePipeline(nexusAlphaCode);

alphaCodePipeline.emit(diagnosticMessages.FIBER_UPDATED);