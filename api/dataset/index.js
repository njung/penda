'use strict'
var config = require(__dirname + '/../../config.json');
var fs = require('fs');
var util = require('util');
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
var mongooseHistory = require('mongoose-history');

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
    description : String,
    keywords : String,
    source : String,
    contact : String,
    releaseFreq : String,
    level : String,
    year : Number,
    scope : String,
    reference : String,
    category : [],
    keywords : String,
    totalRows : Number,
    totalColumns : Number,
    tableSchema : {},
    createdAt : Date,
    updatedAt : Date,
    error : {},
    uploaderId : String,
  }

  var s = new mongoose.Schema(schema);
  s.plugin(mongooseHistory);
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
        timeout : false,
        output : "stream",
        maxBytes : 1000000000,
        allow : "multipart/form-data",
        parse : true,
      }
    }
  });
 
  self.server.route({
    method: "GET",
    path: "/api/datasets",
    handler: function(request, reply) {
      self.list(request, reply);
    },
		config : {
			auth : false,
    }
  });
  
  self.server.route({
    method: "GET",
    path: "/api/dataset/{filename}",
    handler: function(request, reply) {
      self.get(request, reply);
    },
		config : {
			auth : false,
    }
  });
  
  self.server.route({
    method: "DELETE",
    path: "/api/dataset/{filename}",
    handler: function(request, reply) {
      self.delete(request, reply);
    },
		config : {
			/* auth : false, */
    }
  });
}

// This dataset CRUD use filename as ID instead of MongoDB's _id

Dataset.prototype.delete = function(request, reply) {
  var self = this;
  var filename = request.params.filename;
  // Check in db first
  datasetModel().findOne({filename : filename}, function(err,result) {
    if (err) {
      console.log(err);
      return reply(boom.wrap(err));
    }
    if (!result || result.length == 0) return reply(boom.notFound());
    result.status = 'deleted';
    console.log(result);
    datasetModel().findOneAndUpdate({filename : filename}, result, function(err) {
      if (err) {
        console.log(err);
        return reply(boom.wrap(err));
      }
      console.log(result);
      reply();
    })
  })
}

Dataset.prototype.list = function(request, reply) {
  var self = this;
  // TODO pagination query, List all for admin
  var limit = request.query.limit || 10;
  var page = request.query.page || 1;
  var count;
  limit = parseInt(limit);
  page = parseInt(page);
  var opt = {status: { $ne : 'deleted' }};
	if (request.query.status) {
		opt.status = request.query.status;
	}
	console.log(opt);
  datasetModel()
  .count(opt)
  .exec(function(err, result) {
    if (err) {
      console.log(err);
      return reply(boom.wrap(err));
    }
    count = result;
    datasetModel()
    .find(opt)
    .sort({_id:-1})
    .limit(limit)
    .skip(limit * (page - 1))
    .exec(function(err, result){
      if (err) {
        console.log(err);
        return reply(boom.wrap(err));
      }
			// TODO Assign uploader data
      var obj = {
        total : count,
        page : page,
        data : result,
      }
      reply(obj);
    })
  })
}

Dataset.prototype.get = function(request, reply) {
  var self = this;
  var filename = request.params.filename;
  var type = request.query.type;
  // Check in db first
  datasetModel().findOne({filename : filename}, function(err,result) {
    if (err) {
      console.log(err);
      return reply(boom.wrap(err));
    }
    if (!result) return reply(boom.notFound());
    if (request.query.sql && result.status=='done') {
      // Check for cached sql
      // TODO use non throw sqlite3
      tablespoon.createTable(JSON.parse(fs.readFileSync(config.datasetsPath + '/' + filename + '.valid.json', 'utf-8')), filename, null, null, function(err) {
        console.log(err);
        console.log(request.query.sql);
        setTimeout(function(){
          // Get total
          var sql = 'select count(*) as total from ' + filename;
          tablespoon.query(sql, function(result) {
            var sql = request.query.sql.replace(/%22/g,'"');
            tablespoon.query(sql, function(rows) {
              if (request.query.type && request.query.type === 'csv') {
                return reply(babyparse.unparse(rows.rows));
              }
              return reply(rows.rows)
            })
          })
        }, 500);
      });
    } else if (request.query.type && result.status=='done') {
      // Return a downloadable text file
      fs.readFile(config.datasetsPath + '/' + filename + '.valid.' + type, 'utf-8', function(err, result){
        if (err) {
          console.log(err);
          return reply(boom.wrap(err));
        }
        reply(result)
        .header('Content-Type', 'application/octet-stream')
        .header('content-disposition', 'attachment; filename=' + filename + '.' + type + ';');
      })
    } else {
      reply(result);
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

Dataset.prototype.upload = function(request, reply) {
  var self = this;
  var id = md5((new Date()).valueOf());
  var filename = 'dataset_' + id;
  var prefix = config.datasetsPath + '/';
  var extension = request.payload.content.hapi.filename.split('.');
  extension = extension[extension.length-1];
  var path = prefix + filename + '.' + extension;
  var fws = fs.createWriteStream(path);
  request.payload.content.pipe(fws);
   
  fws.on("finish", function(){
		console.log(request.auth);
    var data = {
      status : 'pending',
      filename : filename,
      title : request.payload.title,
      description : request.payload.description,
      keywords : request.payload.keywords,
      source : request.payload.source,
      contact : request.payload.contact,
      releaseFreq : request.payload.releaseFreq,
      level : request.payload.level,
      year : request.payload.year,
      scope : request.payload.scope,
      reference : request.payload.reference,
      createdAt : new Date(),
			uploaderId : request.payload.uploaderId
    }
    datasetModel().create(data, function(err, result) {
      if (err) {
        console.log(err);
        return reply(boom.wrap(err));
      }
      console.log('converting...');
      var cmd = '~/bin/node ' + __dirname + '/converter.js ' + path;
      console.log(cmd);
      var convert = exec(cmd, function(err, stdout, stderr) {
        console.log('save2db...');
        console.log(err);
        console.log(stderr);
        result.status = 'done';
        result.filename = filename;
        if (err) {
          result.status = 'error';
          result.error = util.format(err);
        } else if (stderr) {
          result.status = 'error';
          result.error = util.format(stderr);
        } else {
          var output = JSON.parse(util.format(stdout.toString()));
          console.log(output);
          result.totalRows = output.totalRows; 
          result.totalColumns = output.totalColumns; 
          result.tableSchema = output.schema; 
        }
        result.save();
        console.log('DONE');
      })
      // Do not wait 
      return reply();
    }) 

  });
  fws.on("error", function(err){
    console.log(err);
    reply(err);
  })
}

exports.register = function(server, options, next) {
  new Dataset(server, options, next);
  next();
};

exports.register.attributes = {
  pkg: require("./package.json")
};


