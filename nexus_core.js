class SymbioticNexus {
  constructor(diagnosticServices = [], fiberManagers = []) {
    this.diagnosticServices = diagnosticServices;
    this.fiberManagers = fiberManagers;
    this.reconciliationObserver = new ReconciliationObserver(this);
    this.fiberManagerFactory = new SymbioticFiberManagerFactory(this);
  }

  subscribe(fn) {
    this.reconciliationObserver.addObserver(fn);
  }

  unsubscribe(fn) {
    this.reconciliationObserver.removeObserver(fn);
  }

  async addFiber(fiber) {
    await this.fiberManagerFactory.createFiberManager(fiber);
  }

  async removeFiber(fiber) {
    await this.fiberManagerFactory.deleteFiberManager(fiber);
  }

  addDiagnosticService(diagnosticService) {
    diagnosticService.data = { relatedInformation: [] };
    this.diagnosticServices.push(diagnosticService);
    this.reconciliationObserver.addObserver(diagnosticService);
  }

  removeDiagnosticService(diagnosticService) {
    const index = this.diagnosticServices.indexOf(diagnosticService);
    if (index !== -1) {
      this.diagnosticServices.splice(index, 1);
      this.reconciliationObserver.removeObserver(diagnosticService);
    }
  }

  emit(diagnostic, ...args) {
    const strategy = this.createStrategy(diagnostic.strategyType);
    return diagnostic = strategy.beforeEmit(diagnostic), this.diagnosticServices.emit(diagnostic);
  }

  clear() {
    this.diagnosticServices.clear();
  }

  getDiagnostics() {
    return this.diagnosticServices.history.slice();
  }

  createStrategy(strategyType) {
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

class ReconciliationObserver {
  constructor(diagnosticServices) {
    this.diagnosticServices = diagnosticServices;
  }

  handleDiagnostic(diagnostic) {
    const strategy = ReconfigurationStrategyFactory.createStrategy(diagnostic.strategyType);
    diagnostic = strategy.beforeEmit(diagnostic);
    this.diagnosticServices.reconcile(diagnostic);
  }
}

class ReconfigurationStrategyFactory {
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

class ReconfigurationDecoratorStrategy {
  beforeEmit(diagnostic) {
    const decoratorPayload = {
      relatedInformation: diagnostic.relatedInformation || [],
    };
    return { ...diagnostic, ...decoratorPayload };
  }
}

class ReconfigurationFilterStrategy {
  beforeEmit(diagnostic) {
    return {
      filters: diagnostic.filters.filter(filter => filter.filterType === 'LANE'),
    };
  }
}

class SymbioticFiberManagerFactory {
  constructor(nexus) {
    this.nexus = nexus;
  }

  async createFiberManager(fiber) {
    const fiberManager = SymbioticFiberManager.createManager(fiber);
    this.nexus.fiberManagers.push(fiberManager);
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
    return new SymbioticFiberManager(fiber);
  }

  constructor(fiber) {
    this.fibers = new Set();
    this.addFiber(fiber);
  }

  addFiber(fiber) {
    this.fibers.add(fiber);
  }

  removeFiber(fiber) {
    this.fibers.delete(fiber);
  }
}