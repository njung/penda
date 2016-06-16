'use strict'
var config = require(__dirname + '/../../config.json');
var fs = require('fs');
var readline = require('readline');
var moment = require('moment');
var async = require('async');
var md5 = require('md5');
var csv2json = require('csv-to-json-stream');
var babyparse = require('babyparse');
var jstoxml = require('jstoxml');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var streamJson = require("stream-json");
var StreamArray = require("stream-json/utils/StreamArray");
var mongoose = require('mongoose');
var tablespoon = require('tablespoon').sqlite();
var boom = require('boom');

var Dataset = function(server, options, next) {
  this.server = server;
  this.options = options || {};
  this.registerEndPoints();
  this.cached = [];
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
    path: "/api/upload",
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
    path: "/api/sample",
    handler: function(request, reply) {
      self.sample(request, reply);
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
    path: "/api/dataset/{filename}",
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
  // Check in db first
  datasetModel().find({filename : filename}, function(err,result) {
    if (err) return reply(boom.wrap(err));
    if (!result || result.length == 0) return reply(boom.notFound());
    if (request.query.sql) {
      // Check for cached sql
      if (!self.cached[filename]) {
        try {
          tablespoon.createTable(JSON.parse(fs.readFileSync(config.datasetsPath + '/' + filename + '.valid.json', 'utf-8')), filename);
        } catch(err) {
          console.log(err);
          return reply(boom.wrap(err));
        }
        self.cached[filename] = true;
      }
      console.log(request.query.sql);
      // Get total
      var sql = 'select count(*) as total from ' + filename;
      tablespoon.query(sql, function(result) {
        tablespoon.query(request.query.sql, function(rows) {
          // Assign length and total
          rows['length'] = rows.rows.length;
          rows['total'] = result.rows[0].total;
          return reply(rows)
        })
      })
    } else {
      // Return a downloadable text file
      fs.readFile(config.datasetsPath + '/' + filename + '.valid.' + type, 'utf-8', function(err, result){
        if (err) return reply(boom.wrap(err));
        reply(result)
        .header('Content-Type', 'application/octet-stream')
        .header('content-disposition', 'attachment; filename=' + filename + '.' + type + ';');
      })
    }
  })
}

// TODO remote this sample API
Dataset.prototype.sample = function(request, reply) {
  fs.readFile(config.datasetsPath + '/sample.csv', 'utf-8', function(err, result){
    if (err || !result) return reply(boom.notFound());
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

Dataset.prototype.upload = function(request, reply) {
  var self = this;
  console.log(request.payload);
  var id = md5((new Date()).valueOf());
  var filename = 'dataset_' + id;
  var prefix = config.datasetsPath + '/';
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
      console.log('converting...');
      var cmd = '/usr/local/bin/node ' + __dirname + '/converter.js ' + path;
      console.log(cmd);
      var convert = exec(cmd, function(err, stdout, stderr) {
        console.log('save2db...');
        result.status = 'done';
        result.filename = filename;
        if (err || stderr) {
          result.status = 'err';
        }
        console.log(stdout);
        result.save();
        console.log('DONE');
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


