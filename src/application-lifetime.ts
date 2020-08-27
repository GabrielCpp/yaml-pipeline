import { injectable } from 'inversify';
import { EventEmitter, once } from 'events';

const exitEmitter = new EventEmitter();

export const APPLICATION_LIFETIME = Symbol.for('ApplicationLifetime');

@injectable()
export class ApplicationLifetime {
  public notifyOnExit(handler: () => void) {
    exitEmitter.once('exit', handler);
  }

  public createOnExitPromise(): Promise<any[]> {
    return once(exitEmitter, 'exit');
  }
}

function exitHandler() {
  exitEmitter.emit('exit');
}

//do something when app is closing
process.on('exit', exitHandler);

//catches ctrl+c event
process.on('SIGINT', exitHandler);

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);

//catches uncaught exceptions
process.on('uncaughtException', exitHandler);
