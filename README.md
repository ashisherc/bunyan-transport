# bunyan-transport
A light weight and faster Bunyan transport stream for logentries written from scratch inspired by le_node (does not depend on le_node).

## install
```sh
npm install bunyan-transport --save
```

## use

```js
const bunyan = require('bunyan');
const bunyanTransport = require('bunyan-transport');

const logentriesStream = new bunyanTransport.logentriesStream({
  token: 'token',
  exclude : ["pid"]  // to prevent pid from logged in logentries
});

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
---
![](https://i.imgur.com/Yl06kB8.png)
---

### Options
```
token : 'token string' // required
exclude: [key] ex. pid, hostname, v
debugLogEnabled : true | false // prints transport strean logs, default - false 
port : optional
host : optional
```

# To do
* More website support

### Contribute
Currently bunyan-transport supports only logentries stream, other log website support to be added. Feel free to contribute.