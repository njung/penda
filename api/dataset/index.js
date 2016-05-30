var fs = require('fs');
var readline = require('readline');
var moment = require('moment');
var async = require('async');
var md5 = require('md5');
var csv2json = require('csv-to-json-stream');
var jstoxml = require('jstoxml');
var spawn = require('child_process').spawn;
var streamJson = require("stream-json");
var StreamArray = require("stream-json/utils/StreamArray");
var mongoose = require('mongoose');

var Dataset = function(server, options, next) {
  this.server = server;
  this.options = options || {};
  this.registerEndPoints();
}

var datasetModel = function() {
  var registered = false;
  var m;
  try {
    m = mongoose.model("dataset");
    registered = true;
  } catch(e) {
  }

  if (registered) return m;
  
  var schema = {
    status : String,
    filename : String,
    title : String,
    source : String,
    contact : String,
    releaseFreq : String,
    level : String,
    year : Number,
    scope : String,
    reference : String,
    category : [],
    keywords : String,
    createdAt : Date,
    updatedAt : Date,
  }

  var s = new mongoose.Schema(schema);
  m = mongoose.model("dataset", s);
  return m;
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
 
  // TODO Remove this sample API endpoint 
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

  self.server.route({
    method: "GET",
    path: "/api/datasets",
    handler: function(request, reply) {
      self.datasets(request, reply);
    },
		config : {
			auth : false,
    }
  });
  
  self.server.route({
    method: "GET",
    path: "/api/get-dataset/{filename}",
    handler: function(request, reply) {
      self.getDataset(request, reply);
    },
		config : {
			auth : false,
    }
  });
  
}

Dataset.prototype.getDataset = function(request, reply) {
  var self = this;
  var filename = request.params.filename;
  var type = request.query.type;
  // TODO check in db first
  fs.readFile(__dirname + '/../../data/' + filename + '.' + type, 'utf-8', function(err, result){
    console.log(err);
    reply(result)
    .header('Content-Type', 'application/octet-stream')
    .header('content-disposition', 'attachment; ' + filename + '.' + type + ';');
  })
}

// TODO remote this sample API
Dataset.prototype.dataset = function(request, reply) {
  fs.readFile(__dirname + '/../../data/dataset.csv', 'utf-8', function(err, result){
    console.log(err);
    reply(result).type('text/plain');
  })
}

Dataset.prototype.datasets = function(request, reply) {
  var self = this;
  // TODO pagination query
  datasetModel().find({}, function(err, result){
    if (err) {
      return reply(err).code(500);
    }
    reply(result);
  })
}

// Private
var Converter = function() {}
Converter.prototype.csv2json = function(csvPath, jsonPath) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var map = {};
    var rl = readline.createInterface({
      input: fs.createReadStream(csvPath)
    });
    var firstLine = null;
    rl.on('line', (line) => {
      if (!firstLine) {
        firstLine = line;
        console.log('Line from file:', line);
      }
      rl.close();
    });
    rl.on('close', function(){
      var header = firstLine.split(',');
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
          return reject(err);
        })
        cmd.stdout.on('error', function(err){
          return reject(err);
        });
      })
      stream.on('error', function(err) {
        console.log(err);
        return reject(err);
      })
    })
  })
}
Converter.prototype.json2xml = function(jsonPath, xmlPath) {
  var self = this;
  console.log('xml file path ' + xmlPath);
  return new Promise(function(resolve, reject) {
    fs.appendFileSync(xmlPath, '<dataset>');
    var stream = StreamArray.make();
    stream.output.on("data", function(object){
      console.log(object.index, object.value);
      fs.appendFileSync(xmlPath, `<data>${jstoxml.toXML(object.value)}</data>`);
    });
    stream.output.on("end", function(){
      fs.appendFileSync(xmlPath, '</dataset>');
      console.log("done");
      resolve();
    });
    fs.createReadStream(jsonPath).pipe(stream.input);
  })
}
Converter.prototype.csv2xlsx = function(jsonPath, xlsxPath) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var cmd = spawn('node_modules/.bin/j', ['-f', jsonPath, '-X', '-o', xlsxPath]);
    cmd.stdout.on('error', function(err) {
      console.log(err.toString());
      reject();
    })
    cmd.stdout.on('finish', function() {
      resolve();
    })
  })
}

var converter = new Converter();

Dataset.prototype.upload = function(request, reply) {
  var self = this;
  console.log(request.payload);
  var id = md5((new Date()).valueOf());
  var filename = 'dataset_' + id;
  var prefix = __dirname + '/../../data/';
  console.log(request.payload.opts);
  var path = prefix + filename + '.csv';
  var fws = fs.createWriteStream(path);
  request.payload.content.pipe(fws);
   
  fws.on("finish", function(){
    var data = {
      status : 'progress',
      title : request.payload.title,
      source : request.payload.source,
      contact : request.payload.contact,
      releaseFreq : request.payload.releaseFreq,
      level : request.payload.level,
      year : request.payload.year,
      scope : request.payload.scope,
      reference : request.payload.reference,
    }
    datasetModel().create(data, function(err, result) {
      if (err) {
        return reply(err).code(500);
      }
      // Convert them all
      // CSV --> JSON
      converter.csv2json(path, path.replace('.csv', '.json'))
      .then(function(){
      // JSON --> XLSX
        return converter.csv2xlsx(path, path.replace('.csv', '.xlsx'));
      })
      .then(function(){
      // JSON --> XML
        return converter.json2xml(path.replace('.csv', '.json'), path.replace('.csv', '.xml'))
      })
      .then(function(){
        // TODO update dataset db
        console.log('Converted');
        console.log(result._id);
        result.status = 'done';
        result.filename = filename;
        result.save();
      })
      .catch(function(err){
        console.log(err);
      })

      // Do not wait 
      return reply();
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


