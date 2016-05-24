var fs = require('fs');
var moment = require('moment');
var async = require('async');
var md5 = require('md5');
var csv2json = require('csv-to-json-stream');
var jstoxml = require('jstoxml');
var spawn = require('child_process').spawn;
var streamJson = require("stream-json");
var StreamArray = require("stream-json/utils/StreamArray");

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

// Private
var Converter = function() {}
Converter.prototype.csv2json = function(csvPath, jsonPath) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var map = {};
    // TODO fetch first line to get header's array
    var header = 'kode_provinsi,nama_provinsi,kelompok_usia,tahun,persentase_buta_huruf';
    header = header.split(',');
    for (var i in header) {
      map[header[i]] = i;
    }
    fs.appendFileSync(jsonPath + '.tmp', '[');
    var stream = fs.createReadStream(csvPath).pipe(csv2json({
      delimiter : ',',
      map : map,
      skipHeader: true
    }))
    stream.on('data', function(data){
      fs.appendFileSync(jsonPath + '.tmp', data.toString('utf8').replace('\n',','));
    })
    stream.on('finish', function(){
      var cmd = spawn('sed', ['$ s/.$//', jsonPath + '.tmp']);
      var s = cmd.stdout.pipe(fs.createWriteStream(jsonPath));
      s.on('finish', function(){
        fs.appendFileSync(jsonPath, ']');
        spawn('rm', ['-f', jsonPath + '.tmp']);
        return resolve();
      });
      s.on('error', function(err) {
        // TODO catch err
      })
      cmd.stdout.on('error', function(err){
        // TODO catch err
      });
    })
    stream.on('error', function(err) {
      console.log(err);
      return reject(err);
    })
  })
}
Converter.prototype.json2xml = function(jsonPath, xmlPath) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var stream = StreamArray.make();
     
    stream.output.on("data", function(object){
      console.log(object.index, object.value);
    });
    stream.output.on("end", function(){
      console.log("done");
    });
     
    fs.createReadStream(jsonPath).pipe(stream.input);

  })
}

var converter = new Converter();

Dataset.prototype.upload = function(request, reply) {
  var self = this;
  var id = md5((new Date()).valueOf());
  var filename = 'dataset_' + id + '.csv';
  var prefix = __dirname + '/../../data/';
  console.log(request.payload.opts);
  var path = prefix + filename;
  var fws = fs.createWriteStream(path);
  request.payload.content.pipe(fws);
  fws.on("finish", function(){

    // CSV --> JSON
    converter.csv2json(path, path.replace('.csv', '.json'))
    .then(function(){
    // JSON --> XML
      return converter.json2xml(path.replace('.csv', '.json'), path.replace('.xml'))
    })
    .then(function(){
      return reply();
    })
    .catch(function(err){
      console.log(err);
      return reply(err).code(500);
    })
  });
  fws.on("error", function(err){
    reply(err).code(500);
  })
}

exports.register = function(server, options, next) {
  new Dataset(server, options, next);
  next();
};

exports.register.attributes = {
  pkg: require("./package.json")
};


