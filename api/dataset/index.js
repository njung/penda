var fs = require('fs');
var moment = require('moment');
var async = require('async');
var md5 = require('md5');
var csv2json = require('csv-to-json-stream');

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
  var id = md5((new Date()).valueOf());
  var filename = 'dataset_' + id + '.csv';
  var prefix = __dirname + '/../../data/';
  console.log(request.payload.opts);
  var path = prefix + filename;
  var fws = fs.createWriteStream(path);
  fws.on("finish", function(){
    var map = {};
    var header = 'kode_provinsi,nama_provinsi,kelompok_usia,tahun,persentase_buta_huruf';
    header = header.split(',');
    for (var i in header) {
      map[header[i]] = i;
    }
    // Convert  to JSON file
    var stream = fs.createReadStream(path).pipe(csv2json({
      delimiter : ',',
      map : map,
      skipHeader: true
    })).pipe(fs.createWriteStream(path.replace('.csv', '.json')));
    stream.on('data', function(data){
      console.log(data);
    })
    stream.on('finish', function(){
      reply();
    })
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


