var mongoose = require('mongoose');
var moment = require('moment');
var async = require('async');
var boom = require('boom');
var datasetModel = require(__dirname + '/../dataset/index').model;
var profileModel = require(__dirname + '/../profiles/index').model;
var categoryModel = require(__dirname + '/../category/index').model;

var Stat = function(server, options, next) {
  this.server = server;
  this.options = options || {};
  this.registerEndPoints();
}

Stat.prototype.registerEndPoints = function() {
  var self = this;
  self.server.route({
    method: 'GET',
    path: '/api/stat/sum',
    config : {
      auth : false
    },
    handler: function(request, reply) {
      self.getSum(request, reply);
    }
  });
}

Stat.prototype.getSum = function(request, reply) {
  var self = this;
  // Stat
  var obj = {
    row : 0,
    dataset : 0,
    org : 0,
    category : 0,
  }
  var opt = {status: { $ne : 'deleted' }};
  datasetModel().find(opt, function(err, result) {
    async.eachSeries(result, function(item, cb) {
      obj.row += parseInt(item.totalRows);
      obj.dataset++;
      cb();
    }, function(err) {
      if (err) return cb(err);
      profileModel().find({}, function(err, result) {
        if (err) {
          return reply(err);
        }
        if (result && result.length > 1) {
          obj.org = result.length - 1;
        }
        categoryModel().find({}, function(err, result) {
          if (err) {
            return reply(err);
          }
          if (result && result.length > 0) {
            obj.category = result.length;
          }
          reply(obj);
        })
      })
    })
  })
}

exports.register = function(server, options, next) {
  new Stat(server, options, next);
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
