
var Hello = function(server, options, next) {
  this.server = server;
  this.options = options || {};
  this.registerEndPoints();
}

Hello.prototype.registerEndPoints = function() {
  var self = this;
  self.server.route({
    method: "GET",
    path: "/api/hello",
    handler: function(request, reply) {
      self.hello(request, reply);
    },
		config : {
			auth : false,
    }
  });
}

Hello.prototype.hello = function(request, reply) {
  reply("Hello");
}

exports.register = function(server, options, next) {
  new Hello(server, options, next);
  next();
};

exports.register.attributes = {
  pkg: require("./package.json")
};


