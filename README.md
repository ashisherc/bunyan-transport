# bunyan-transport
A light weight and faster Bunyan transport stream for logentries written from scratch inspired by le_node (does not depend on le_node).

## install
npm install bunyan-transport --save

## use

```
const bunyan = require('bunyan');
const bunyanTransport = require('bunyan-transport');

const logentriesStream = new bunyanTransport.logentriesStream({ token: 'token' });

const logger = bunyan.createLogger({
  name: "Service x",
  streams: [{
    stream: logentriesStream,
    type:'raw', // required
    level: 'trace'
  }]
});

logger.error("error got logged in logentries");
```

Logentries
[logentries](https://i.imgur.com/Yl06kB8.png)


### Options
```
token : 'token string' // required
debugLogEnabled : true | false // prints transport strean logs, default - false 
port : optional
host : optional
```

# To do
More website support
Option to filter log fields to be sent to logentries 

### Contribute
Currently bunyan-transport supports only logentries stream, other log website support to be added. Feel free to contribute.