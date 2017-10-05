import tls from 'tls';
import { Writable } from 'stream';
import reconnectCore from 'reconnect-core';
import RingBuffer from './ringbuffer';

// patterns
const newline = /\n/g;
const tokenPattern = /[a-f\d]{8}-([a-f\d]{4}-){3}[a-f\d]{12}/;

const connectedEvent = 'connected';
const disconnectedEvent = 'disconnected';
const timeoutEvent = 'timed out';
const bufferDrainEvent = 'buffer drain';

const finalizeLogString = (log, token) =>
  `${token} ${log.toString().replace(newline, '\u2028')}\n`;

/**
 * Logger class that handles parsing of logs and sending logs to Logentries.
 */
class Logger extends Writable {
  constructor(opts) {
    super({
      objectMode: true
    });

    this.secure = opts.secure || true;
    this.debugLogEnabled = opts.debugLogEnabled || false;

    this.bufferSize = 16192;
    this.port = opts.port || (this.secure ? 443 : 80);
    this.host = opts.host || 'data.logentries.com';
    this.inactivityTimeout = 15 * 1000;
    this.token = opts.token;
    this.reconnectInitialDelay = 1000;
    this.reconnectMaxDelay =15 * 1000;
    this.reconnectBackoffStrategy = 'fibonacci';

    const isSecure = this.secure;
    this.ringBuffer = new RingBuffer(this.bufferSize);
    this.reconnect = reconnectCore(() => {
      let connection;
      const args = [{
        host: this.host,
        port: this.port
      }]
      if (isSecure) {
        connection = tls.connect.apply(tls, args, () => {
          if (!connection.authorized) {
            const errMsg = connection.authorizationError;
            this.debugLog(errMsg);
          } else if (tls && tls.CleartextStream && connection instanceof tls.CleartextStream) {
            this.emit('connect');
          }
        });
      } else {
        connection = net.connect.apply(null, args);
      }
      if (!opts.disableTimeout) {
        connection.setTimeout(this.inactivityTimeout);
      }
      return connection;
    });

    this.ringBuffer.on('buffer shift', () => {
      this.debugLog('Buffer is full, will be shifting records until buffer is drained.');
    });

    this.on(bufferDrainEvent, () => {
      this.debugLog('RingBuffer drained.');
      this.drained = true;
    });

    this.on(timeoutEvent, () => {
      if (this.drained) {
        this.debugLog(
          `Socket was inactive for ${this.inactivityTimeout / 1000} seconds. Destroying.`);
        this.closeConnection();
      } else {
        this.debugLog('Inactivity timeout event emitted but buffer was not drained.');
        this.once(bufferDrainEvent, () => {
          this.debugLog('Buffer drain event emitted for inactivity timeout.');
          this.closeConnection();
        });
      }
    });
  }

  _write(ch, enc, cb) {
    this.drained = false;
    this.connection.then(conn => {
      const record = this.ringBuffer.read();
      if (record) {
        if (this.ringBuffer.isEmpty()) {
          conn.write(record, () => {
            process.nextTick(() => {
              this.emit(bufferDrainEvent);
            });
          });
        } else {
          conn.write(record);
        }
      }
      cb();
    }).catch(err => {
      this.debugLog(`Error: ${err}`);
      cb();
    });
  }

  log(log) {
    if (this.ringBuffer.write(finalizeLogString(log, this.token))) {
      this.write();
    }
  }

  closeConnection() {
    this.debugLog('Closing retry mechanism along with its connection.');
    if (!this.reconnection) {
      this.debugLog('No reconnection instance found. Returning.');
      return;
    }
    this.reconnection.disconnect();
    this.connection = null;
  }

  get connection() {
    if (this._connection) {
      return this._connection;
    }

    this.debugLog('No connection exists. Creating a new one.');
    if (this.reconnection) {
      this.reconnection.disconnect();
      this.reconnection = null;
    }

    this.reconnection = this.reconnect({
      initialDelay: this.reconnectInitialDelay,
      maxDelay: this.reconnectMaxDelay,
      strategy: this.reconnectBackoffStrategy,
      failAfter: Infinity,
      randomisationFactor: 0,
      immediate: false
    });

    this.connection = new Promise((resolve) => {

      this.reconnection.on('connect', (connection) => {
        this.emit(connectedEvent);

        connection.on('timeout', () => {
          this.emit(timeoutEvent);
        });
        resolve(connection);
      });

      this.reconnection.on('reconnect', (n, delay) => {
        if (n > 0) {
          this.debugLog(`Trying to reconnect. Times: ${n} , previous delay: ${delay}`);
        }
      });

      this.reconnection.once('disconnect', () => {
        this.debugLog('Socket was disconnected');
        this.connection = null;
        this.emit(disconnectedEvent);
      });

      this.reconnection.on('error', (err) => {
        this.debugLog(`Error occurred during connection: ${err}`);
      });

      this.reconnection.connect();
    });
    return this.connection;
  }
  
  set connection(obj) {
    this._connection = obj;
  }

  get reconnection() {
    return this._reconnection;
  }
  
  set reconnection(func) {
    this._reconnection = func;
  }

  debugLog(message){
    if(this.debugLogEnabled){
      console.log(message);
    }
  }
}

export {
  Logger as default,
};
