import { Observable, Subject, from } from 'rxjs';
import { map, filter, catchError } from 'rxjs/operators';

interface StrategyContext {
  state: any;
}

interface Strategy {
  execute(context: StrategyContext): Promise<any>;
}

class StrategiesFactoryImpl {
  private strategies = {
    ExampleStrategy: class ExampleStrategyImpl implements Strategy {
      async execute(strategyContext: StrategyContext): Promise<any> {
        const updatedResult = await this._strategyImpl.execute(strategyContext);
        return updatedResult;
      }
    }
  };

  async createStrategy(strategyName: string): Promise<Strategy> {
    const strategyImpl = this.strategies[strategyName];
    if (!strategyImpl) {
      throw new Error(`Strategy implementation for '${strategyName}' not found.`);
    }
    return new strategyImpl();
  }
}

class ContextManagerFactoryImpl {
  async createContextManager(strategyName: string, contextManagerName: string): Promise<ContextManager> {
    const strategy = await this.getStrategy(strategyName);
    return new ContextManager(strategyName, contextManagerName, strategy);
  }

  async getStrategy(strategyName: string): Promise<Strategy> {
    const strategyImpl = this.strategies[strategyName];
    if (!strategyImpl) {
      throw new Error(`Strategy implementation for '${strategyName}' not found.`);
    }
    return new strategyImpl();
  }
}

class ContextManager implements Strategy {
  private strategyName: string;
  private contextManagerName: string;
  private subject: Subject;

  constructor(strategyName: string, contextManagerName: string, strategy: Strategy) {
    this.strategyName = strategyName;
    this.contextManagerName = contextManagerName;
    this.strategy = strategy;
  }

  get strategy(): Strategy {
    return this._strategy;
  }

  async executeContextManager(contextManagerName: string): Promise<Subject> {
    const observable = new Observable((observer) => {
      const subject = new Subject();
      this.subject = subject;
      try {
        const result = await this.strategy.execute({ state: {} });
        subject.next(result);
      } catch (error) {
        subject.error(error);
      }
      return () => subject.unsubscribe();
    });
    return observable;
  }

  detachObserver(observer: any): void {
    if (this.observers && this.observers.length > 0) {
      this.observers = this.observers.filter((obs: any) => obs !== observer);
    }
  }

  get observers(): any[] {
    return this.observers;
  }

  attachObserver(observer: any): void {
    if (this.observers) {
      this.observers.push(observer);
    }
  }
}

class RxStrategyRunner {
  constructor(observables: Observable[]) {}

  async runStrategy(strategyName: string, observables: Observable[]): Promise<Subject> {
    const strategy = await this.getStrategy(strategyName);
    const contextManager = await this.getContextManager(strategyName, 'ExampleContextManager');
    const subject = new Subject();
    observables.push(subject);
    try {
      const result = await contextManager.executeContextManager(strategyName);
      return subject;
    } catch (error) {
      return subject.error(error);
    }
  }

  private async getStrategy(strategyName: string): Promise<Strategy> {
    const strategyFactory = new StrategiesFactoryImpl();
    return strategyFactory.createStrategy(strategyName);
  }

  private async getContextManager(strategyName: string, contextManagerName: string): Promise<ContextManager> {
    const contextManagerFactory = new ContextManagerFactoryImpl();
    return contextManagerFactory.createContextManager(strategyName, contextManagerName);
  }
}

async function main(): Promise<void> {
  try {
    const strategyName = 'ExampleStrategy';
    const observables = [new Subject()];
    const subject = await new RxStrategyRunner(observables).runStrategy(strategyName, observables);
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

main().catch((error) => console.error('Error occurred:', error));