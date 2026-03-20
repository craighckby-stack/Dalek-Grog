+++ npx-nexus-core.js +++
class ApplicationFactory {
  constructor() {
    this.eventBus = new EventBus();
    this.container = new DependencyContainer();
  }

  async createApplication() {
    const strategyImpl = await this.container.get('StrategyImpl', () => new StrategyImpl('Default Strategy'));
    const strategyModule = await this.container.get('StrategyModule', () => new StrategyModule('Default Strategy Module'));
    const eventPublisher = new EventPublisher(this.eventBus);

    await strategyImpl.executeAsync({}); // Removed unnecessary await keyword
    await strategyModule.executeAsync({}); // Removed unnecessary await keyword

    await new StrategyRegistry().register('default', strategyImpl);
    await new StrategyRegistry().register('defaultModule', strategyModule);

    eventPublisher.publish('default', {});
    this.eventBus.subscribe('default', async _ => {
      // Handle event
    });

    const application = new Application(this.eventBus);
    await application.init();

    return application;
  }
}

class RepositoryFactory {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.container = new DependencyContainer();
  }

  async createRepository(type) {
    const repositoryClass = await this.container.get(`Repository-${type}`, () => new Repository(type));
    return repositoryClass;
  }
}

class StrategyModuleFactory {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.container = new DependencyContainer();
  }

  async createStrategyModule(config) {
    const strategyModuleClass = await this.container.get(`StrategyModule-${config.module}`, () => new StrategyModule(config.module));
    return strategyModuleClass;
  }
}

class EventPublisher {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }

  publish(type, event) {
    this.eventBus.publish(type, event);
  }
}

class Repository {
  constructor(name, config, eventBus) {
    this.strategies = new Map();
    this.moduleStrategies = new Map();
    this.config = config;
    this.eventBus = eventBus;
  }

  registerStrategy(strategy) {
    this.strategies.set(strategy.name, strategy);
  }

  registerModuleStrategy(strategyModule) {
    this.moduleStrategies.set(strategyModule.name, strategyModule);
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

  publish(type, event) {
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
    const repository = await this.dependencyContainer.get('Repository', () => new Repository('Default Repository'));

    await this.eventBus.subscribe('default', _ => {
      // Handle event
    });

    const strategies = await repository.getStrategies();
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

abstract class DependencyContainer {
  async get(type, factory = () => {}) {
    return factory();
  }
}

class StrategyRegistry {
  async register(type, strategy) {
    // implementation not provided, removed to maintain abstract class
  }
}