import { Writable } from 'stream';
import _ from 'lodash';
import Logger from './logger';

class logentriesStream extends Writable {
  constructor(opts) {
    super({
      objectMode: true
    });

    const loggerOpts = _.clone(opts || {});

    this.logger = new Logger(loggerOpts);
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
    this.logger.log(JSON.stringify(log));
    setImmediate(cb);
  }
}

export { logentriesStream as default };
