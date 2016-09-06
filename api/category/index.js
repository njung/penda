var mongoose = require('mongoose');
var Joi = require('joi');
var _ = require('lodash');
var uuid = require('uuid');
var parse = require('mongoose-parse');
var moment = require('moment');
var async = require('async');
var request = require('request');
var boom = require('boom');

var createSchema = {
  name : Joi.string().required(),
}

var updateSchema = {
  name : Joi.string().required(),
  _id : Joi.string().required(),
  __v : Joi.any().optional(),
  ___v : Joi.any().optional(),
  createdAt : Joi.string().optional(),
  updatedAt : Joi.string().optional(),
  lastModifiedBy : Joi.string().optional(),
}

var categoryModel = function() {
  var registered = false;
  var m;
  try {
    m = mongoose.model('Categories');
    registered = true;
  } catch(e) {
  }

  if (registered) return m;
  
  var schema = {
    name : String,
    createdAt : Date,
    updatedAt : Date,
    lastModifiedBy : String,
  }

  var s = new mongoose.Schema(schema);
  m = mongoose.model('Categories', s);
  return m;
}

var Categories = function(server, options, next) {
  this.server = server;
  this.options = options || {};
  this.registerEndPoints();
}

Categories.prototype.registerEndPoints = function() {
  var self = this;
  self.server.route({
    method: 'GET',
    path: '/api/categories',
    config : {
      auth : false,
      validate : {
        query : {
          page : Joi.number().optional(),
          limit : Joi.number().optional(),
        }
      }
    },
    handler: function(request, reply) {
      self.list(request, reply);
    }
  });
  self.server.route({
    method: 'POST',
    path: '/api/categories',
    handler: function(request, reply) {
      self.create(request, reply);
    },
    config : {
      validate : {
        payload: Joi.object(createSchema)
      }
    }
  });
  self.server.route({
    method: 'GET',
    path: '/api/category/{id}',
    config : {
      auth : false,
      validate : {
        params : {
          id : Joi.string().required(),
        }
      }
    },
    handler: function(request, reply) {
      self.read(request, reply);
    }
  });
  self.server.route({
    method: 'POST',
    path: '/api/category/{id}',
    config : {
      validate : {
        payload: Joi.object(updateSchema)
      }
    },
    handler: function(request, reply) {
      self.update(request, reply);
    }
  });
  self.server.route({
    method: 'DELETE',
    path: '/api/category/{id}',
    handler: function(request, reply) {
      self.delete(request, reply);
    }
  });
}

Categories.prototype.list = function(request, reply) {
  var self = this;
  var limit = request.query.limit || 10;
  var page = request.query.page || 1;
  var count;
  limit = parseInt(limit);
  page = parseInt(page);
  
  // count all record
  categoryModel()
    .count()
    .exec(function(err, result){
    if (err) {
      return reply(err).statusCode = 400;
    }
    count = result;
    categoryModel()
      .find()
      .limit(limit)
      .sort({_id:-1})
      .skip(limit * (page - 1))
      .lean()
      .exec(function(err, result) {
      if (err) {
        return reply(err).statusCode = 400;
      }
      var obj = {
        total : count,
        page : page,
        limit : limit,
        data : result
      }
      reply(obj).type('application/json');
    });
  });
}

Categories.prototype.create = function(request, reply) {
  var self = this;
  // role should be admin only
  if (request.auth.credentials.role != 'admin') {
    return reply(boom.unauthorized()); 
  }
  categoryModel().create(request.payload, function(err, result) {
    if (err) {
      return reply(parse(err)).statusCode = 400;
    } else {
      reply(result);
    }
  })
}

Categories.prototype.read = function(request, reply) {
  var self = this;
  var bogus = self.checkBogus(request.params.id);
  if (bogus.isBogus) {
    return reply(bogus.reply).statusCode = 404;
  }
  categoryModel()
    .findOne({_id:request.params.id})
    .exec(function(err, result) {
    if (err) {
      return reply(err).statusCode = 400;
    }
    // Do not check for existency since it has been validated by bogus
    reply(result).type('application/json');
  });
}


Categories.prototype.update = function(request, reply) {
  var self = this;
  var bogus = self.checkBogus(request.params.id);
  if (bogus.isBogus) {
    return reply(bogus.reply).statusCode = 404;
  }
  // role should be admin only
  if (request.auth.credentials.role != 'admin') {
    return reply(boom.unauthorized()); 
  }
  var options = {upsert: true};
  request.payload.updatedAt = moment();
  request.payload.lastModifiedBy = request.auth.credentials.userId;
  delete(request.payload.createdAt);
  delete(request.payload.__v);
  delete(request.payload._id);
  categoryModel()
    .findOneAndUpdate(
    {_id:request.params.id}, 
    { $set : request.payload},
    function(err, result) {
    if (err) {
      return reply(err).statusCode = 400;
    }
    // Do not check for existency since it has been validated by bogus
    categoryModel()
      .findOne({_id:request.params.id})
      .exec(function(err, result) {
      if (err) {
        return reply(err).statusCode = 400;
      }
      reply(result);
    });
  });
}


Categories.prototype.delete = function(request, reply) {
  var self = this;
  var bogus = self.checkBogus(request.params.id);
  if (bogus.isBogus) {
    return reply(bogus.reply).statusCode = 404;
  }
  if (request.auth.credentials.role != 'admin') {
    return reply(boom.unauthorized()); 
  }
  categoryModel()
    .remove({_id:request.params.id})
    .exec(function(err, result) {
    if (err) {
      return reply(err).statusCode = 400;
    }
    reply({success : true});
  })
}


Categories.prototype.checkBogus = function(id) {
  var bogus = false;
  try {
    id = mongoose.Types.ObjectId(id);
  } catch (err) {
    bogus = true;
  }
  var result = {
    isBogus: bogus,
    reply: !bogus? {} : {
      error: 'Not Found',
      statusCode: 404,
      message: 'Not found',
      validation: {
        source: 'DB',
        keys: ['id']
      }
    }
  }
  return result;
}



exports.register = function(server, options, next) {
  new Categories(server, options, next);
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};

exports.model = categoryModel;
exports.class = Categories.prototype;


