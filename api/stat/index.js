var Joi = require('joi');
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
      auth : false,
      tags : ['api'],
      description : 'Dataset summary stat (public)',
      notes : 'This endpoint returns the total of : rows, datasets, uploader/organization, and categories',
      plugins : {
        'hapi-swagger' : {
          responses : {
            '200': {
              description : 'OK',
              schema : Joi.object({
                row : Joi.string(),
                dataset : Joi.number(),
                org : Joi.number(),
                category : Joi.number(),
              })
            },
            '400' : {
              description : 'Bad request',
            },
            '500': {
              description : 'Internal server error',
            },
          }
        }
      },
    },
    handler: function(request, reply) {
      self.getSum(request, reply);
    }
  });
  
  self.server.route({
    method: 'GET',
    path: '/api/stat/complete',
    config : {
      auth : false,
      tags : ['api'],
      description : 'Dataset complete stat (public)',
      notes : 'This endpoint returns the total of dataset by category and uploader',
      plugins : {
        'hapi-swagger' : {
          responses : {
            '200': {
              description : 'OK',
              schema : Joi.object({
                row : Joi.string(),
                dataset : Joi.number(),
                org : Joi.number(),
                category : Joi.number(),
              })
            },
            '400' : {
              description : 'Bad request',
            },
            '500': {
              description : 'Internal server error',
            },
          }
        }
      },
    },
    handler: function(request, reply) {
      self.getComplete(request, reply);
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
      if (item.totalRows) {
        obj.row += parseInt(item.totalRows);
      }
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

Stat.prototype.getComplete = function(request, reply) {
  var self = this;
  // Stat
  var obj = {
    byUploader : [
    ],
    byCategory : [
    ]
  }
  var opt = {status: { $ne : 'deleted' }};
  profileModel().find({}, function(err, users) {
    if (err) {
      return reply(err);
    }
    categoryModel().find({}, function(err, categories) {
      if (err) {
        return reply(err);
      }
      async.eachSeries(users, function(user, cb) {
        var opt = {
          status: { $ne : 'deleted' },
          uploaderId : user.userId,
        };
        if (user.username == 'hukum') {
        }
        datasetModel().find(opt, function(err, datasets){
          if (err) {
            return reply(err);
          }
          var totalRows = 0;
          async.eachSeries(datasets, function(dataset, cb2) {
            totalRows += parseInt(dataset.totalRows);
            cb2();
          }, function(){
            obj.byUploader.push({
              name : user.fullName,
              totalDatasets : datasets.length,
              totalRows : totalRows,
            })
            cb();
          })
        })
      }, function(err) {
        if (err) {
          return reply(err);
        }
        async.eachSeries(categories, function(category, cb) {
          var opt = {
            status: { $ne : 'deleted' },
            category : { $in : [category.name] },
          };
          datasetModel().find(opt, function(err, datasets){
            if (err) {
              return reply(err);
            }
            var totalRows = 0;
            async.eachSeries(datasets, function(dataset, cb2) {
              totalRows += parseInt(dataset.totalRows);
              cb2();
            }, function(){
              obj.byCategory.push({
                name : category.name,
                totalDatasets : datasets.length,
                totalRows : totalRows,
              })
              cb();
            })
          })
        }, function(err) {
          if (err) {
            return reply(err);
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
