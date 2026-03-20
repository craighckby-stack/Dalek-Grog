import { Injectable } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Registry } from '@dialogflow/enterprise-cloud-sdk';
import { EventBus, Event } from './event-bus';

interface Strategy {
  name: string;
  execute: (config: object) => void;
  executeAsync?: (config: object) => Promise<void>;
}

class StrategyImpl implements Strategy {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  execute(config: object): void {
    console.log(`Executing strategy: ${this.name} with config: ${JSON.stringify(config)}`);
  }

  async executeAsync(config: object): Promise<void> {
    console.log(`Executing async strategy: ${this.name} with config: ${JSON.stringify(config)}`);
  }
}

class StrategyModule {
  private name: string;
  private register: (config: object) => void;

  constructor(name: string, register: (config: object) => void) {
    this.name = name;
    this.register = register;
  }

  async createStrategy(registryName: string, dependencyContainer: object): Promise<Strategy> {
    const strategyModule = await dependencyContainer.get<ModuleRegistry>('ModuleRegistry').getModule(this.name);
    return await strategyModule.createStrategy(strategyModule, registryName);
  }

  static createStrategyModule(name: string, register: (config: object) => void): StrategyModule {
    return new StrategyModule(name, register);
  }
}

class Repository {
  private name: string;
  private eventBus: EventBus;
  private strategies: Map<string, Strategy>;
  private moduleStrategies: Map<string, Strategy>;
  private config: object;

  constructor(name: string, config: object, eventBus: EventBus) {
    this.name = name;
    this.strategies = new Map();
    this.moduleStrategies = new Map();
    this.config = config;
    this.eventBus = eventBus;
  }

  registerStrategy(strategy: Strategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  registerModuleStrategy(strategyModule: Strategy): void {
    this.moduleStrategies.set(strategyModule.name, strategyModule);
  }

  getConfig(): object {
    return this.config;
  }

  setConfig(config: object): void {
    this.config = config;
  }

  async getStrategies(): Promise<Map<string, Strategy>> {
    return this.strategies;
  }

  async getModuleStrategies(): Promise<Map<string, Strategy>> {
    return this.moduleStrategies;
  }

  async createStrategy(registryName: string, dependencyContainer: object): Promise<Strategy> {
    const registry = await dependencyContainer.get<Registry>('Registry');
    const strategyModule = await this.getModuleStrategies().get(registryName);
    return await strategyModule.createStrategy(registryName, dependencyContainer);
  }
}

class Application {
  private eventBus: EventBus;
  private dependencyContainer: DependencyProperty;

  constructor() {
    this.eventBus = new EventBus();
    this.dependencyContainer = {
      'Repository': () => new Repository('Default Repository', {}, this.eventBus),
      'StrategyModule': () => new StrategyModule(),
      'StrategyImpl': () => new StrategyImpl('Default Strategy'),
      'EventBus': () => new EventBus(),
      get(id: string): object {
        return this[id]();
      }
    };
  }

  async init(): Promise<void> {
    const eventBus = this.dependencyContainer['EventBus'];
    const repository = this.dependencyContainer['Repository'];
    const strategyModule = this.dependencyContainer['StrategyModule'];
    const strategyImpl = this.dependencyContainer['StrategyImpl'];

    repository.registerStrategy(strategyImpl);
    repository.registerModuleStrategy(strategyModule);

    // Subscribe to strategy execution
    await repository.getStrategies().forEach(async (strategy) => {
      eventBus.subscribe(strategy.name, async (event: Event) => {
        strategy.execute(event);
        if (strategy.executeAsync) {
          await strategy.executeAsync(event);
        }
      });
    });
  }
}

class EventBus {
  private listeners: Map<string, Function>;

  constructor() {
    this.listeners = new Map();
  }

  subscribe(type: string, listener: Function): void {
    this.listeners.set(type, listener);
  }

  unsubscribe(type: string, listener: Function): void {
    this.listeners.delete(type, listener);
  }

  async publish(type: string, event: Event): Promise<void> {
    if (this.listeners.has(type)) {
      const listener = this.listeners.get(type);
      await listener(event);
    } else {
      throw new Error(`No listeners for event type: ${type}`);
    }
  }
}

interface Event {
  type: string;
  data: any;
}