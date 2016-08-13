var req = require('request');
var boom = require('boom');
var xml2json = require('xml2json');

var RSS = function(server, options, next) {
  this.server = server;
  this.options = options || {};
  this.registerEndPoints();
}

RSS.prototype.registerEndPoints = function() {
  var self = this;
  self.server.route({
    method: 'GET',
    path: '/api/rss',
    config : {
      auth : false
    },
    handler: function(request, reply) {
      req(request.query.url, function(error, response, body){
        try {
          var data = JSON.parse(xml2json.toJson(body));
          reply(data.rss.channel.item);
        } catch(err) {
          console.log(err);
          reply(err);
        }
      })
    }
  });
}
exports.register = function(server, options, next) {
  new RSS(server, options, next);
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};

