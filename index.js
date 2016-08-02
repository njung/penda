var pkg = require("./package");
var os = require("os");
var Hapi = require('hapi');
var sources = require("./api/");
var Inert = require('inert');
var Vision = require('vision');
var HapiSwagger = require('hapi-swagger');
var Path = require('path');
var fs = require('fs');
var server = new Hapi.Server();
var mode = process.env.MODE || 'dev';
var port = JSON.parse(fs.readFileSync(__dirname + '/config/' + mode + '/main.json'))[0][1].split(':')[2];

if (process.env.PORT) port = parseInt(process.env.PORT)

server.connection({ 
  port: port, 
  labels: ['api'], 
  routes: {
    cors : {
      origin : ["*"],
      headers : ["Accept", "Accept-language","Authorization", "host",  "Content-Type", "host"],
      exposedHeaders : ["token", "current_user"],
    }
  }
});

sources.populate(server);

var swaggerOptions = {
 info : {
    title : 'Penda API Documentation',
    version : pkg.version.toString(),
  }
}
server.register([Inert, Vision, { 'register' : HapiSwagger, 'options' : swaggerOptions }], function(err) {
  if (err) {
    console.log(err);
  } else {
  }
});

server.route({
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: 'public'
    }
  },
  config : {
      auth: false,
  },
});

server.start(function(err){
  if (err) {
    console.log(err);
  } else {
    console.log("server is running at", server.info.port);
  }
});

module.exports = server;
