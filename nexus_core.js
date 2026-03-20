class ContextDelegatingDecorator extends EventDispatcher {
  constructor(strategy) {
    super();
    this.contextType = 'decorator';
    this.strategy = strategy;
  }

  async handleDiagnostic(diagnostic) {
    this.strategy.before(diagnostic);
    await this._next(diagnostic);
    this.strategy.after(diagnostic);
  }

  async _next(diagnostic) {
    for (const next of this._getPipeline()) {
      await next(diagnostic);
    }
  }

  _getPipeline() {
    const pipeline = [];

    const contextManager = this.getContextManager();
    const reconfigurationContext = contextManager.getContext('reconfiguration');
    const decoratorStrategy = reconfigurationContext.getDecoratorStrategy();

    pipeline.push(strategy => decoratorStrategy.before(diagnostic));
    pipeline.push(async diagnostic => {
      contextManager.emit('diagnostic', diagnostic);
    });
    pipeline.push(strategy => decoratorStrategy.after(diagnostic));

    return pipeline;
  }

  getContextManager() {
    return this.nexus.getContextManager(this.contextId);
  }

  getDecoratorStrategy() {
    return this.reconfigurationStrategy.getDecoratorStrategy();
  }
}

class ContextDelegatingFilter extends ContextDelegatingDecorator {
  async handleDiagnostic(diagnostic) {
    this.strategy.before(diagnostic);
    diagnostic.filtered = true;
    await this._next(diagnostic);
    this.strategy.after(diagnostic);
  }

  _getPipeline() {
    const pipeline = super._getPipeline();

    pipeline.pop();

    pipeline.push(async diagnostic => {
      diagnostic.filtered = true;
    });

    return pipeline;
  }
}

class asyncContextManager extends EventDispatcher {
  async handleDiagnostic(diagnostic) {
    const result = await this._doAsyncOperation(diagnostic.metadata);
    diagnostic.result = result;
    this.reconfigurationStrategy.after(diagnostic);
    await this._next(diagnostic);
  }

  async _doAsyncOperation(metadata) {
    return await this.nexus.getAsyncOperationStrategy(metadata).perform(metadata);
  }

  _getPipeline() {
    const pipeline = [];

    const contextManager = this.getContextManager();
    const reconfigurationContext = contextManager.getContext('reconfiguration');
    const asyncOperationStrategy = reconfigurationContext.getAsyncOperationStrategy();

    pipeline.push(strategy => asyncOperationStrategy.before(metadata));
    pipeline.push(async metadata => {
      contextManager.emit('diagnostic', diagnostic);
    });
    pipeline.push(strategy => asyncOperationStrategy.after(metadata));

    return pipeline;
  }

  getAsyncOperationStrategy(metadata) {
    return this.nexus.getAsyncOperationStrategy(metadata);
  }
}

class DiagnosticServices extends EventDispatcher {
  async start() {
    await this._startContextManager();
    await this._subscribeDiagnosticListeners();
  }

  async _startContextManager() {
    await this.nexus.startSymbioticFiberManagerPool();
    await this.nexus.loadContextManagerFactory();
    await this.nexus.initReconfigurationStrategy();
  }

  async _subscribeDiagnosticListeners() {
    for (const listener of this.nexus.getDiagnosticListeners()) {
      this.subscribe(listener);
    }
  }

  async stop() {
    await this._unsubscribeDiagnosticListeners();
    await this._shutdownContextManager();
  }

  async _unsubscribeDiagnosticListeners() {
    for (const listener of this.nexus.getDiagnosticListeners()) {
      this.unsubscribe(listener);
    }
  }

  async _shutdownContextManager() {
    await this.nexus.stopSymbioticFiberManagerPool();
  }

  async getDiagnosticEvents() {
    return await this.nexus.getAsyncOperationStrategy(JSON.stringify({ event: 'diagnostic' })).perform(JSON.stringify({ event: 'diagnostic' }));
  }
}

class Nexus {
  async startSymbioticFiberManagerPool() {
    await this._startSymbioticFiberManagerPool();
    await this._startSymbioticFiberManagerPoolAsync();
  }

  async _startSymbioticFiberManagerPool() {
    await this.symbioticFiberManagerPool.start();
  }

  async _startSymbioticFiberManagerPoolAsync() {
    await this.symbioticFiberManagerPool.startAsync();
  }

  async stopSymbioticFiberManagerPool() {
    await this.symbioticFiberManagerPool.stop();
  }

  async loadContextManagerFactory() {
    await this._loadContextManagerFactory();
    await this._loadContextManagerFactoryAsync();
  }

  async _loadContextManagerFactory() {
    await this.contextManagerFactory.load();
  }

  async _loadContextManagerFactoryAsync() {
    await this.contextManagerFactory.loadAsync();
  }

  async initReconfigurationStrategy() {
    await this._initReconfigurationStrategy();
    await this._initReconfigurationStrategyAsync();
  }

  async _initReconfigurationStrategy() {
    this.reconfigurationStrategy.before = async () => {};
    this.reconfigurationStrategy.after = async () => {};
  }

  async _initReconfigurationStrategyAsync() {
    this.reconfigurationStrategy.before = async () => Promise.resolve();
    this.reconfigurationStrategy.after = async () => Promise.resolve();
  }

  async getAsyncOperationStrategy(metadata) {
    return this.asyncOperationStrategyFactory.getAsyncOperationStrategy(metadata);
  }

  async performOperation(metadata) {
    return await this.asyncOperationStrategyFactory.performAsyncOperation(metadata);
  }

  async startSymbioticFiber() {
    await this.symbioticFiberManager.start();
  }

  async stopSymbioticFiber() {
    await this.symbioticFiberManager.stop();
  }

  async subscribeDiagnosticListener(listener) {
    await this.contextManagerFactory.subscribe(listener);
  }

  async unsubscribeDiagnosticListener(listener) {
    await this.contextManagerFactory.unsubscribe(listener);
  }

  async getDiagnosticListeners() {
    return this.contextManagerFactory.getListeners();
  }

  async getAsyncOperationStrategyFactory() {
    return this.asyncOperationStrategyFactory;
  }

  async getReconfigurationStrategy() {
    return this.reconfigurationStrategy;
  }
}

class ReconfigurationStrategy {
  async reconfigure(diagnostic) {
    throw new Error('Must implement reconfigure method');
  }
}

class ReconfigurationDecoratorStrategy extends ReconfigurationStrategy {
  constructor(strategy) {
    super();
    this.decorator = strategy;
  }

  async reconfigure(diagnostic) {
    return this.decorator(diagnostic);
  }
}

class ReconfigurationFilterStrategy extends ReconfigurationStrategy {
  async reconfigure(diagnostic) {
    diagnostic.filtered = true;
    return diagnostic;
  }
}

class ReconfigurationDataStrategy extends ReconfigurationStrategy {
  constructor(data) {
    super();
    this.data = data;
  }

  async reconfigure(diagnostic) {
    diagnostic.data = this.data;
    return diagnostic;
  }
}