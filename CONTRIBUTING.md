**Event Handlers**

class EventHandlers {
  async onEvent(event) {
    switch (event.type) {
      case 'NEW_CONTRIBUTION':
        this.#newContribution(event);
        break;
      case 'UPDATE_CODE':
        this.#updateCode(event);
        break;
      default:
        console.log(`Unknown event type: ${event.type}`);
    }
  }

  #newContribution(event) {
    console.log(`Received new contribution event: ${event.contribution.id}`);
  }

  #updateCode(event) {
    console.log(`Received update code event: ${event.code.sha}`);
  }
}

**Mediator**

class Mediator {
  async handleEvent(event) {
    const eventHandlers = new EventHandlers();
    eventHandlers.onEvent(event);
    
    const commands = new Commands();
    commands.handleCommand(event.command);

    const queries = new Queries();
    queries.handleQuery(event.query);
  }
}

**Commands**

class Commands {
  async handleCommand(command) {
    switch (command.type) {
      case 'CREATE_CONTRIBUTION':
        this.#createContribution(command);
        break;
      case 'UPDATE_CODE':
        this.#updateCode(command);
        break;
      default:
        console.log(`Unknown command type: ${command.type}`);
    }
  }

  #createContribution(command) {
    console.log(`Received create contribution command: ${command.contribution.id}`);
  }

  #updateCode(command) {
    console.log(`Received update code command: ${command.code.sha}`);
  }
}

**Queries**

class Queries {
  async handleQuery(query) {
    switch (query.type) {
      case 'GET_CONTRIBUTIONS':
        this.#getContributions(query);
        break;
      case 'GET_CODE':
        this.#getCode(query);
        break;
      default:
        console.log(`Unknown query type: ${query.type}`);
    }
  }

  #getContributions(query) {
    console.log(`Received get contributions query`);
  }

  #getCode(query) {
    console.log(`Received get code query`);
  }
}

**Contribution**

class Contribution {
  constructor(id, content) {
    this.id = id;
    this.content = content;
  }

  async save() {
    console.log(`Saved contribution: ${this.id}`);
  }
}

**Code**

class Code {
  constructor(sha, content) {
    this.sha = sha;
    this.content = content;
  }

  async update() {
    console.log(`Updated code: ${this.sha}`);
  }
}