+++ npx-nexus-core.js +++
class ApplicationFactory {
  constructor(eventBus, dependencyContainer) {
    this.eventBus = eventBus;
    this.dependencyContainer = dependencyContainer;
  }

  async createApplication() {
    const strategyImpl = await this.dependencyContainer.get('StrategyImpl');
    const strategyModule = await this.dependencyContainer.get('StrategyModule');
    const eventPublisher = new EventPublisher(this.eventBus);

    await strategyImpl.executeAsync({});
    await strategyModule.executeAsync({});

    await new StrategyRegistry(this.dependencyContainer).register('default', strategyImpl);
    await new StrategyRegistry(this.dependencyContainer).register('defaultModule', strategyModule);

    eventPublisher.publish('default', {});

    const application = new Application(this.eventBus);
    await application.init();

    return application;
  }
}

class RepositoryFactory {
  constructor(eventBus, dependencyContainer) {
    this.eventBus = eventBus;
    this.dependencyContainer = dependencyContainer;
  }

  async createRepository(type) {
    const repositoryClass = await this.dependencyContainer.get(`Repository-${type}`);
    return repositoryClass;
  }
}

class StrategyModuleFactory {
  constructor(eventBus, dependencyContainer) {
    this.eventBus = eventBus;
    this.dependencyContainer = dependencyContainer;
  }

  async createStrategyModule(config) {
    const strategyModuleClass = await this.dependencyContainer.get(`StrategyModule-${config.module}`);
    return strategyModuleClass;
  }
}

class EventPublisher {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }

  publish(type, event) {
    this.eventBus.publishEvent(type, event);
  }
}

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(type, listener) {
    this.listeners.set(type, listener);
  }

  unsubscribe(type, listener) {
    this.listeners.delete(type, listener);
  }

  publishEvent(type, event) {
    const listener = this.listeners.get(type);
    listener(event);
  }
}

class Application {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.dependencyContainer = new DependencyContainer();
  }

  async init() {
    const repository = await this.dependencyContainer.get('Repository');
    const strategies = await new StrategyRegistry(this.dependencyContainer).getStrategies();
    strategies.forEach(async strategy => {
      await this.eventBus.subscribe(strategy.name, async event => {
        await strategy.executeAsync(event);
      });
    });
  }
}

class StrategyImpl {
  constructor(name) {
    this.name = name;
  }

  async executeAsync(event) {
    console.log(`Executing async strategy: ${this.name} with event: ${JSON.stringify(event)}`);
  }
}

class StrategyModule {
  constructor(name) {
    this.name = name;
  }

  async executeAsync(event) {
    console.log(`Executing async strategy module: ${this.name} with event: ${JSON.stringify(event)}`);
  }
}

class DependencyContainer {
  async get(type) {
    return await new FactoryManager(this).get(type);
  }

  getFactory(type) {
    switch (type) {
      case 'Repository-Default':
        return new RepositoryFactory(this.eventBus, this);
      case 'Repository-DefaultRepository':
        return new RepositoryFactory(this.eventBus, this);
      case 'StrategyModule-Default Strategy':
        return new StrategyModuleFactory(this.eventBus, this);
      case 'StrategyModule-Default Strategy Module':
        return new StrategyModuleFactory(this.eventBus, this);
      case 'StrategyImpl':
        return new StrategyImplFactory(this);
      case 'StrategyModule':
        return new StrategyModuleFactory(this.eventBus, this);
      case 'Repository':
        return new RepositoryFactory(this.eventBus, this);
      case 'Repository-DefaultRepository':
        return new RepositoryFactory(this.eventBus, this);
      case 'StrategyRegistry':
        return new StrategyRegistryFactory(this);
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }
}

class FactoryManager {
  constructor(dependencyContainer) {
    this.dependencyContainer = dependencyContainer;
  }

  async get(type) {
    const factory = this.dependencyContainer.getFactory(type);
    return await factory.create();
  }
}

class StrategyImplFactory {
  constructor(dependencyContainer) {
    this.dependencyContainer = dependencyContainer;
  }

  async create() {
    return new StrategyImpl('Default Strategy');
  }
}

class StrategyModuleFactory {
  constructor(eventBus, dependencyContainer) {
    this.eventBus = eventBus;
    this.dependencyContainer = dependencyContainer;
  }

  async create() {
    return new StrategyModule('Default Strategy Module');
  }
}

class StrategyModuleFactory {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }

  async create() {
    return new StrategyModule();
  }
}

class StrategyRegistry {
  constructor(dependencyContainer) {
    this.dependencyContainer = dependencyContainer;
  }

  async register(type, strategy) {
    // implementation not provided, removed to maintain abstract class
  }

  async getStrategies() {
    const strategies = [
      new StrategyImpl('Default Strategy'),
      new StrategyModule('Default Strategy Module'),
    ];
    return strategies;
  }
}

class StrategyRegistryFactory {
  constructor(dependencyContainer) {
    this.dependencyContainer = dependencyContainer;
  }

  async create() {
    return new StrategyRegistry(this.dependencyContainer);
  }
}

class RepositoryFactory {
  constructor(eventBus, dependencyContainer) {
    this.eventBus = eventBus;
    this.dependencyContainer = dependencyContainer;
  }

  async createRepository(type) {
    return new Repository(type);
  }
}

class Database {
  async getStrategies() {
    return [];
  }
}