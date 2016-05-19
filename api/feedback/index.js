var mongoose = require("mongoose");
var Joi = require("joi");
var _ = require("lodash");
var uuid = require("uuid");
var parse = require("mongoose-parse");
var moment = require("moment");
var async = require("async");
var request = require("request");
var boom = require("boom");
var ProfileModel = require('../profiles').model;
var getUserId = require('../profiles').class.getUserId;
var getUserMap = require('../profiles').class.getUserMap;
var Email = require('../email').class;

var schema = {
  type : Joi.string().required(),
  body : Joi.string().required(),
}

var feedbackModel = function() {
  var registered = false;
  var m;
  try {
    m = mongoose.model("Feedbacks");
    registered = true;
  } catch(e) {
  }

  if (registered) return m;
  
  var schema = {
    body : String,
    type : String,
    createdAt : Date,
  }

  var s = new mongoose.Schema(schema);
  m = mongoose.model("Feedbacks", s);
  return m;
}

var Feedbacks = function(server, options, next) {
  this.server = server;
  this.options = options || {};
  this.registerEndPoints();
}

Feedbacks.prototype.registerEndPoints = function() {
  var self = this;
  self.server.route({
    method: "POST",
    path: "/api/feedbacks",
    handler: function(request, reply) {
      self.create(request, reply);
    },
    config : {
      validate : {
        payload: Joi.object(schema)
      }
    }
  });
}

Feedbacks.prototype.create = function(request, reply) {
  var self = this;
  request.payload.createdAt = new Date();
  feedbackModel().create(request.payload, function(err, result) {
    if (err) {
      return reply(parse(err)).statusCode = 400;
    }
    Email.sendFeedbackSubmission(request.auth.credentials.username, request.payload.type, request.payload.body)
    reply();
  })
}

exports.register = function(server, options, next) {
  new Feedbacks(server, options, next);
  next();
};

exports.register.attributes = {
  pkg: require("./package.json")
};

exports.model = feedbackModel;

exports.class = Feedbacks.prototype;


