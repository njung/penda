var pkg = require("./package");
var os = require("os");
var Hapi = require('hapi');
var sources = require("./api/");
var Inert = require('inert');
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

server.register(Inert, function(){});

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
