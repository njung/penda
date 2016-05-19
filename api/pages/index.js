var mongoose = require("mongoose");
var Joi = require("joi");
var _ = require("lodash");
var uuid = require("uuid");
var parse = require("mongoose-parse");
var moment = require("moment");
var async = require("async");
var request = require("request");
var boom = require("boom");

var schema = {
  title : Joi.string().required(),
  content : Joi.string().required(),
  type : Joi.string().allow("").optional(),
  url : Joi.string().allow("").optional(),
}

var updateSchema = {
  _id : Joi.string(),
  __v : Joi.allow("").optional(),
  title : Joi.string().required(),
  content : Joi.string().required(),
  type : Joi.string().allow("").optional(),
  url : Joi.string().allow("").optional(),
}

var pageModel = function() {
  var registered = false;
  var m;
  try {
    m = mongoose.model("Pages");
    registered = true;
  } catch(e) {
  }

  if (registered) return m;
  
  var schema = {
    title : String,
    content : String,
    updateDate : Date,
    modifiedBy : String,
    type : String,
    url : String,
  }

  var s = new mongoose.Schema(schema);
  m = mongoose.model("Pages", s);
  return m;
}

var Pages = function(server, options, next) {
  this.server = server;
  this.options = options || {};
  this.registerEndPoints();
}

Pages.prototype.registerEndPoints = function() {
  var self = this;
  self.server.route({
    method: "GET",
    path: "/api/pages",
    config : {
      auth : false
    },
    handler: function(request, reply) {
      self.list(request, reply);
    }
  });
  self.server.route({
    method: "POST",
    path: "/api/pages",
    handler: function(request, reply) {
      self.create(request, reply);
    },
    config : {
      validate : {
        payload: Joi.object(schema)
      }
    }
  });
  self.server.route({
    method: "GET",
    path: "/api/page/{id}",
    config : {
      auth : false
    },
    handler: function(request, reply) {
      self.get(request, reply);
    }
  });
  self.server.route({
    method: "GET",
    path: "/api/page-by-url/{url}",
    config : {
      auth : false
    },
    handler: function(request, reply) {
      self.getByUrl(request, reply);
    }
  });
  self.server.route({
    method: "POST",
    path: "/api/page/{id}",
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
    method: "DELETE",
    path: "/api/page/{id}",
    handler: function(request, reply) {
      self.delete(request, reply);
    }
  });
}

Pages.prototype.list = function(request, reply) {
  var self = this;
  var defaultLimit = 10;
  var limit = request.query.limit || defaultLimit;
  limit = parseInt(limit);
  var page = request.query.page || 0;
  page = parseInt(page);
  var query = {};
  var count;
  
  // count all record
  pageModel()
    .count(query)
    .exec(function(err, result){
    if (err) {
      return reply(err).statusCode = 400;
    }
    count = result;
    pageModel()
      .find(query)
      .limit(limit)
      .sort({date:-1})
      .skip(limit * page)
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
      reply(obj).type("application/json");
    });
  });
}

Pages.prototype.create = function(request, reply) {
  var self = this;
  // rule should be admin only
  if (request.auth.credentials.rule != "admin") {
    return reply(boom.unauthorized()); 
  }
  pageModel().create(request.payload, function(err, result) {
    if (err) {
      return reply(parse(err)).statusCode = 400;
    } else {
      reply(result);
    }
  })
}

Pages.prototype.get = function(request, reply) {
  var self = this;
  var bogus = self.checkBogus(request.params.id);
  if (bogus.isBogus) {
    return reply(bogus.reply).statusCode = 404;
  }
  pageModel()
    .findOne({_id:request.params.id})
    .exec(function(err, result) {
    if (err) {
      return reply(err).statusCode = 400;
    }
    if (!result) {
      return reply({
        error: "Not Found", 
        statusCode: 404, 
        message: "Country was not found"
      }).code(400);
    }
    reply(result).type("application/json");
  });
}

Pages.prototype.getByUrl = function(request, reply) {
  var self = this;
  pageModel()
    .findOne({url:request.params.url})
    .exec(function(err, result) {
    if (err) {
      return reply(err).statusCode = 400;
    }
    if (!result) {
      return reply({
        error: "Not Found", 
        statusCode: 404, 
        message: "Country was not found"
      }).code(400);
    }
    reply(result).type("application/json");
  });
}



Pages.prototype.update = function(request, reply) {
  var self = this;
  var bogus = self.checkBogus(request.params.id);
  if (bogus.isBogus) {
    return reply(bogus.reply).statusCode = 404;
  }
  // rule should be admin only
  if (request.auth.credentials.rule != "admin") {
    return reply(boom.unauthorized()); 
  }
  var options = {upsert: true};
  request.payload.updateDate = moment();
  request.payload.modifiedBy = request.auth.credentials.userId;
  pageModel()
    .findOneAndUpdate(
    {_id:request.params.id}, 
    { $set : request.payload},
    function(err, result) {
    if (err) {
      return reply(err).statusCode = 400;
    }
    if (!result) {
      return reply({
        error: "Not Found", 
        statusCode: 404, 
        message: "Country was not found"
      }).code(400);
    }
    pageModel()
      .findOne({_id:request.params.id})
      .exec(function(err, result) {
      if (err) {
        return reply(err).statusCode = 400;
      }
      reply(result);
    });
  });
}


Pages.prototype.delete = function(request, reply) {
  var self = this;
  var bogus = self.checkBogus(request.params.id);
  if (bogus.isBogus) {
    return reply(bogus.reply).statusCode = 404;
  }
  if (request.auth.credentials.rule != "admin") {
    return reply(boom.unauthorized()); 
  }
  pageModel()
    .remove({_id:request.params.id})
    .exec(function(err, result) {
    if (err) {
      return reply(err).statusCode = 400;
    }
    reply({success : true});
  })
}


Pages.prototype.checkBogus = function(id) {
  var bogus = false;
  try {
    id = mongoose.Types.ObjectId(id);
  } catch (err) {
    bogus = true;
  }
  var result = {
    isBogus: bogus,
    reply: !bogus? {} : {
      error: "Not Found",
      statusCode: 404,
      message: "User profile was not found",
      validation: {
        source: "DB",
        keys: ["id"]
      }
    }
  }
  return result;
}



exports.register = function(server, options, next) {
  new Pages(server, options, next);
  next();
};

exports.register.attributes = {
  pkg: require("./package.json")
};

exports.model = pageModel;

exports.class = Pages.prototype;


