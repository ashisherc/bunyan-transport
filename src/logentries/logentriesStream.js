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
    this.logger.log(JSON.stringify(log));
    setImmediate(cb);
  }
}

export { logentriesStream as default };
