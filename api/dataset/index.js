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
var Joi = require('joi');
var JoiAssert = require('joi-assert');
var mongooseHistory = require('mongoose-history');
var profileModel = require(__dirname + '/../../api/profiles/index').model();
var nodeBinaryPath = process.env.NODE_BIN;

var Dataset = function(server, options, next) {
  this.server = server;
  this.options = options || {};
  this.registerEndPoints();
  this.cached = [];
}

var DatasetSchema = {
  title : Joi.string().required(),
  source : Joi.string().required(),
  releaseFreq : Joi.string().optional(), 
  year : Joi.number().optional(),
  contact : Joi.string().optional(),
  level : Joi.string().optional(),
  scope : Joi.string().optional(),
  category : Joi.array().items(Joi.string()),
  dateStart : Joi.date().optional(),
  dateEnd : Joi.date().optional(),
  uploaderId : Joi.string().optional(), 
}


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
  month : Number,
  dateStart : Date,
  dateEnd : Date,
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
  uploader : String,
  uploaderFullName : String,
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
  

  var s = new mongoose.Schema(schema);
  s.plugin(mongooseHistory);
  m = mongoose.model("dataset", s);
  return m;
}

Dataset.prototype.registerEndPoints = function() {
  var self = this;

  var uploadConfig = {
    payload : {
      timeout : false,
      output : "stream",
      maxBytes : 1000000000,
      allow : "multipart/form-data",
      parse : true,
    },
    validate : {
      payload : {
        data : Joi.required(),
        file : Joi.required(),
      }
    },
    tags : ['api'],
    description : 'Dataset Upload (restricted)',
    notes : 'Upload dataset with its metadata',
  }
  self.server.route({
    method: "POST",
    path: "/api/upload",
    handler: function(request, reply) {
      self.upload(request, reply);
    },
    config: uploadConfig
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
    method: "POST",
    path: "/api/dataset/{filename}",
    handler: function(request, reply) {
      self.update(request, reply);
    },
    config : {
      validate : {
        payload : {
          __v : Joi.number().optional(),
          _id : Joi.string().optional(),
          category : Joi.array().items(Joi.string()),
          dateEnd : Joi.date().optional(),
          dateStart : Joi.date().optional(),
          filename : Joi.string().optional(),
          contact : Joi.string().optional(),
          level : Joi.string().optional(),
          releaseFreq : Joi.string().optional(),
          schema : Joi.any().optional(),
          scope : Joi.string().optional(),
          source : Joi.string().optional(),
          status : Joi.string().optional(),
          tableSchema : Joi.any().optional(),
          title : Joi.string().optional(),
          totalColumns : Joi.number().optional(),
          totalRows : Joi.number().optional(),
          uploader : Joi.string().optional(),
          uploaderFullName : Joi.string().optional(),
          uploaderId : Joi.string().optional(),
          year : Joi.number().optional(),
        }
      }
    }
  });
  
  self.server.route({
    method: "DELETE",
    path: "/api/dataset/{filename}",
    handler: function(request, reply) {
      self.delete(request, reply);
    },
  });
}

// This dataset CRUD use filename as ID instead of MongoDB's _id
Dataset.prototype.update = function(request, reply) {
  var self = this;
  var filename = request.params.filename
  datasetModel().findOne({filename : filename}).lean().exec(function(err, result) {
    if (err) {
      console.log(err);
      return reply(boom.wrap(err));
    }
    if (!result || result.length == 0) return reply(boom.notFound());

    // role should be admin or the owner
    if (!(request.auth.credentials.role == 'admin' || request.auth.credentials.userId == result.uploaderId)) {
      return reply(boom.unauthorized()); 
    }
    delete(request.payload._id);
    delete(request.payload.__v);
		delete(request.payload.createdAt);
		console.log(request.payload);
    datasetModel().findOneAndUpdate({filename : filename}, request.payload, function(err) {
      if (err) {
        console.log(err);
        return reply(boom.wrap(err));
      }
  		datasetModel().findOne({filename : filename}).lean().exec(function(err, changed) {
        if (err) {
          console.log(err);
          return reply(boom.wrap(err));
        }
      	reply(changed);
			})
    })
  })
}

Dataset.prototype.delete = function(request, reply) {
  var self = this;
  var filename = request.params.filename;
  // Check in db first
  datasetModel().findOne({filename : filename}).lean().exec(function(err,result) {
    if (err) {
      console.log(err);
      return reply(boom.wrap(err));
    }
    if (!result || result.length == 0) return reply(boom.notFound());

    // role should be admin or the owner
    if (!(request.auth.credentials.role == 'admin' || request.auth.credentials.userId == result.uploaderId)) {
      return reply(boom.unauthorized()); 
    }

    result.status = 'deleted';
    delete(result._id);
    delete(result.__v);
    datasetModel().findOneAndUpdate({filename : filename}, result, function(err) {
      if (err) {
        console.log(err);
        return reply(boom.wrap(err));
      }
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
  // Set operator
  let operator = request.query.operator || 'or';
  // Searchable fields
  let searchable = ['title', 'description', 'uploader', 'category'];
  // Handle query by fields
  let queryKeys = Object.keys(request.query);
  opt['$' + operator] = [];
  for (var i in queryKeys) {
    // Except page and limit. Search will be handled separatedly
    if (Object.keys(schema).indexOf(queryKeys[i]) < 0) {
      continue;
    }
    if (searchable.indexOf(queryKeys[i]) < 0) {
      continue;
    }
    let r = new RegExp('^' +  request.query[queryKeys[i]] + '$','i');
    let obj = {};
    if (queryKeys[i] === 'category') {
      /* obj[queryKeys[i]] = { $in : [request.query[queryKeys[i]]] } */
      obj[queryKeys[i]] = { $in : [r] }
    } else {
      obj[queryKeys[i]] = { $regex : r }
    }
    opt['$' + operator].push(obj);
  }
  // Is OR empty?
  if (opt['$' + operator].length < 1) {
    delete(opt['$' + operator]);
  }
  // TODO Handle wide search
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
        limit : limit,
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

        setTimeout(function(){
          // Get total
          var sql = 'select count(*) as total from ' + filename;
          tablespoon.query(sql, function(result) {
            var sql = new Buffer(request.query.sql, 'base64');
            sql = sql.toString();
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

Dataset.prototype.upload = function(request, reply) {
  var self = this;
  var id = md5((new Date()).valueOf());
  var filename = 'dataset_' + id;
  var prefix = config.datasetsPath + '/';
  var extension = request.payload.file.hapi.filename.split('.');
  extension = extension[extension.length-1];
  var path = prefix + filename + '.' + extension;
  var fws = fs.createWriteStream(path);
  request.payload.file.pipe(fws);

  // Test the payload data against joi schema
  var payload = JSON.parse(request.payload.data);
  try {
    Joi.assert(payload, DatasetSchema);
  } catch(err) {
    return reply(err.message).statusCode = 400
  }
  console.log(payload);
  fws.on("finish", function(){
    var data = {
      status : 'pending',
      filename : filename,
      title : payload.title,
      description : payload.description,
      keywords : payload.keywords,
      source : payload.source,
      contact : payload.contact,
      releaseFreq : payload.releaseFreq,
      level : payload.level,
      scope : payload.scope,
      reference : payload.reference,
      createdAt : new Date(),
			uploaderId : payload.uploaderId,
			uploader : payload.uploader,
      dateStart : payload.dateStart,
      dateEnd : payload.dateEnd,
      category : payload.category,
    }
    if (data.releaseFreq === 'year') {
      data.year = payload.year;
    }
    if (data.releaseFreq === 'month') {
      data.month = payload.month;
    }
    profileModel
    .findOne({userId : request.auth.credentials.userId})
    .lean()
    .exec(function(err, profile){
      if (err || !profile) {
        return reply(boom.unauthorized()); 
      }
      data.uploader = request.auth.credentials.username;
      data.uploaderFullName = profile.fullName;
      data.uploaderId = request.auth.credentials.userId;
      datasetModel().create(data, function(err, result) {
        if (err) {
          console.log(err);
          return reply(boom.wrap(err));
        }
        var cmd = nodeBinaryPath + ' ' + __dirname + '/converter.js ' + path;
        console.log(cmd);
        var convert = exec(cmd, function(err, stdout, stderr) {
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
            result.totalRows = output.totalRows; 
            result.totalColumns = output.totalColumns; 
            result.tableSchema = output.schema; 
          }
          result.save();
        })
        // Do not wait 
        return reply(result);
      }) 
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
exports.model = datasetModel;

