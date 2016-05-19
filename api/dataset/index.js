var fs = require('fs');
var moment = require('moment');

var Dataset = function(server, options, next) {
  this.server = server;
  this.options = options || {};
  this.registerEndPoints();
}

Dataset.prototype.registerEndPoints = function() {
  var self = this;
 
  self.server.route({
    method: "POST",
    path: "/api/dataset/upload",
    handler: function(request, reply) {
      self.upload(request, reply);
    },
    config: {
      // TODO extend Hawk timeout
      auth : false,
      payload : {
        output : "stream",
        maxBytes : 1000000000,
        allow : "multipart/form-data",
        parse : true,
      }
    }
  });
  
  self.server.route({
    method: "GET",
    path: "/api/dataset",
    handler: function(request, reply) {
      self.dataset(request, reply);
    },
		config : {
			auth : false,
    }
  });
  
}

Dataset.prototype.dataset = function(request, reply) {
  fs.readFile(__dirname + '/../../data/dataset.csv', 'utf-8', function(err, result){
    console.log(err);
    reply(result).type('text/plain');
  })
}

Dataset.prototype.upload = function(request, reply) {
  var self = this;
  var filename = 'dataset_' + moment().format("YYYY-MM-DD") + '_' + (new Date()).valueOf();
  var prefix = __dirname + '/../../data/';
  console.log(request.payload.opts);
  var path = prefix + filename;
  var fws = fs.createWriteStream(path);
  fws.on("finish", function(){
    reply();
  });
  fws.on("error", function(err){
    reply(err).code(500);
  })
  request.payload.content.pipe(fws);
}


exports.register = function(server, options, next) {
  new Dataset(server, options, next);
  next();
};

exports.register.attributes = {
  pkg: require("./package.json")
};


