import { Writable } from 'stream';
import _ from 'lodash';
import Logger from './logger';

class LogentriesStream extends Writable {
  constructor(opts) {
    super({
      objectMode: true
    });

    this.loggerOpts = _.clone(opts || {});
    // TODO create options object with only fields for Logger
    this.logger = new Logger(this.loggerOpts);
  }

  _write(log, enc, cb) {
    const levels = {
      10: 'trace',
      20: 'debug',
      30: 'info',
      40: 'warn',
      50: 'error',
      60: 'fatal'
    }
    log.level = levels[log.level];
    if (this.loggerOpts.exclude) {
      for(var key of this.loggerOpts.exclude){
        delete log[key];
      }
    }
    this.logger.log(JSON.stringify(log));
    setImmediate(cb);
  }
}

export { LogentriesStream as default };
