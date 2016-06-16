var realServer = require(__dirname + "/../index");
var hawk = require("hawk");
var prefix = "http://localhost:7000";

var server = {}
server.inject = function(request, cb) {
  if (!request.hawk) return realServer.inject(request, cb);
  var header = hawk.client.header(prefix + request.url, request.method, { credentials : request.hawk });
  if (!request.headers) request.headers = {};
  request.headers.Authorization = header.field;
  request.headers.host = prefix.split("//")[1];
  realServer.inject(request,cb);
}

module.exports = server;
