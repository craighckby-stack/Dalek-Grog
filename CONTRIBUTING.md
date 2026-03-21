Here's an enhanced version of the given code. It adheres to SOLID principles, uses TypeScript, and includes additional features for error handling, logging, and unit testing.

### **EventHandlers**

class EventHandlers {
  private handlers: Map<string, (event: any) => void>;

  constructor() {
    this.handlers = new Map([
      ['NEW_CONTRIBUTION', (event: any) => this.#newContribution(event)],
      ['UPDATE_CODE', (event: any) => this.#updateCode(event)],
    ]);
  }

  public async onEvent(event: any): Promise<void> {
    const handler = this.handlers.get(event.type);
    if (!handler) {
      console.error(`Unknown event type: ${event.type}`);
      throw new Error(`Unknown event type: ${event.type}`);
    }

    try {
      await handler(event);
    } catch (error) {
      console.error(`Error handling event: ${event.type}`, error);
      throw error;
    }
  }

  private async #newContribution(event: any): Promise<void> {
    console.log(`Received new contribution event: ${event.contribution.id}`);
  }

  private async #updateCode(event: any): Promise<void> {
    console.log(`Received update code event: ${event.code.sha}`);
  }
}

### **Mediator**

class Mediator {
  private eventHandlers: EventHandlers;
  private commands: Commands;
  private queries: Queries;

  constructor() {
    this.eventHandlers = new EventHandlers();
    this.commands = new Commands();
    this.queries = new Queries();
  }

  public async handleEvent(event: any): Promise<void> {
    try {
      await this.eventHandlers.onEvent(event);
      await this.commands.handleCommand(event.command);
      await this.queries.handleQuery(event.query);
    } catch (error) {
      console.error(`Error handling event: ${event.type}`, error);
      throw error;
    }
  }
}

### **Commands**

class Commands {
  private commands: Map<string, (command: any) => void>;

  constructor() {
    this.commands = new Map([
      ['CREATE_CONTRIBUTION', (command: any) => this.#createContribution(command)],
      ['UPDATE_CODE', (command: any) => this.#updateCode(command)],
    ]);
  }

  public async handleCommand(command: any): Promise<void> {
    const handler = this.commands.get(command.type);
    if (!handler) {
      console.error(`Unknown command type: ${command.type}`);
      throw new Error(`Unknown command type: ${command.type}`);
    }

    try {
      await handler(command);
    } catch (error) {
      console.error(`Error handling command: ${command.type}`, error);
      throw error;
    }
  }

  private async #createContribution(command: any): Promise<void> {
    console.log(`Received create contribution command: ${command.contribution.id}`);
    const contribution = new Contribution(command.contribution.id, command.contribution.content);
    await contribution.save();
  }

  private async #updateCode(command: any): Promise<void> {
    console.log(`Received update code command: ${command.code.sha}`);
    const code = new Code(command.code.sha, command.code.content);
    await code.update();
  }
}

### **Queries**

class Queries {
  private queries: Map<string, (query: any) => void>;

  constructor() {
    this.queries = new Map([
      ['GET_CONTRIBUTIONS', (query: any) => this.#getContributions(query)],
      ['GET_CODE', (query: any) => this.#getCode(query)],
    ]);
  }

  public async handleQuery(query: any): Promise<void> {
    const handler = this.queries.get(query.type);
    if (!handler) {
      console.error(`Unknown query type: ${query.type}`);
      throw new Error(`Unknown query type: ${query.type}`);
    }

    try {
      await handler(query);
    } catch (error) {
      console.error(`Error handling query: ${query.type}`, error);
      throw error;
    }
  }

  private async #getContributions(query: any): Promise<void> {
    console.log(`Received get contributions query`);
    // Fetch contributions from database or API
  }

  private async #getCode(query: any): Promise<void> {
    console.log(`Received get code query`);
    // Fetch code from database or API
  }
}

### **Contribution**

class Contribution {
  private id: string;
  private content: any;

  constructor(id: string, content: any) {
    this.id = id;
    this.content = content;
  }

  public async save(): Promise<void> {
    console.log(`Saved contribution: ${this.id}`);
    // Save contribution to database or API
  }
}

### **Code**

class Code {
  private sha: string;
  private content: any;

  constructor(sha: string, content: any) {
    this.sha = sha;
    this.content = content;
  }

  public async update(): Promise<void> {
    console.log(`Updated code: ${this.sha}`);
    // Update code in database or API
  }
}

### **Usage**

const mediator = new Mediator();

const event = {
  type: 'NEW_CONTRIBUTION',
  contribution: {
    id: 'contribution-1',
    content: 'This is a contribution',
  },
};

const command = {
  type: 'CREATE_CONTRIBUTION',
  contribution: {
    id: 'contribution-2',
    content: 'This is another contribution',
  },
};

const query = {
  type: 'GET_CONTRIBUTIONS',
};

try {
  await mediator.handleEvent(event);
  await mediator.handleCommand(command);
  await mediator.handleQuery(query);
} catch (error) {
  console.error(error);
}

### **Unit Tests**

describe('EventHandlers', () => {
  it('should handle new contribution event', async () => {
    const event = {
      type: 'NEW_CONTRIBUTION',
      contribution: {
        id: 'contribution-1',
        content: 'This is a contribution',
      },
    };

    const eventHandlers = new EventHandlers();
    await eventHandlers.onEvent(event);
    // Verify that the contribution was saved successfully
  });

  it('should handle update code event', async () => {
    const event = {
      type: 'UPDATE_CODE',
      code: {
        sha: 'code-sha',
        content: 'This is code',
      },
    };

    const eventHandlers = new EventHandlers();
    await eventHandlers.onEvent(event);
    // Verify that the code was updated successfully
  });
});

describe('Commands', () => {
  it('should create a new contribution', async () => {
    const command = {
      type: 'CREATE_CONTRIBUTION',
      contribution: {
        id: 'contribution-1',
        content: 'This is a contribution',
      },
    };

    const commands = new Commands();
    await commands.handleCommand(command);
    // Verify that the contribution was created successfully
  });

  it('should update code', async () => {
    const command = {
      type: 'UPDATE_CODE',
      code: {
        sha: 'code-sha',
        content: 'This is code',
      },
    };

    const commands = new Commands();
    await commands.handleCommand(command);
    // Verify that the code was updated successfully
  });
});

describe('Queries', () => {
  it('should get contributions', async () => {
    const query = {
      type: 'GET_CONTRIBUTIONS',
    };

    const queries = new Queries();
    await queries.handleQuery(query);
    // Verify that the contributions were retrieved successfully
  });

  it('should get code', async () => {
    const query = {
      type: 'GET_CODE',
    };

    const queries = new Queries();
    await queries.handleQuery(query);
    // Verify that the code was retrieved successfully
  });
});

Note that this implementation assumes a database or API to store and retrieve data. You may need to modify it to fit your specific use case. Additionally, this is just an example usage of the provided code and you may want to add more features and error handling to make it more robust.