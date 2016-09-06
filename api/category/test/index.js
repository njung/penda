var server = require(__dirname + '/../../../index');
var mongoose = require('mongoose');
var server = require(__dirname + '/../../../index');
var model = require(__dirname + '/../index').model();
var passportLocalMongoose = require('passport-local-mongoose');
var fs = require('fs');
var _ = require('lodash');
var uuid = require('uuid');
var moment = require('moment');
var async = require('async');
var generateUser = require(__dirname + '/../../../api/00-user/index').generateUser;
var profileModel = require(__dirname + '/../../../api/profiles/index').model();
var should = require('should');
require('must');

var port = '3000';
if (process.env.PORT) port = process.env.PORT;
var prefix = 'http://localhost:' + port;
var token, token2, id;

describe('Category', function() {
  this.timeout(300000);
  var allDone = false;
  before(function(done){
    mongoose.connection.on('connected', function() {
      if (allDone) return;
        done();
    });
    if (!mongoose.connection.readyState) {
      mongoose.connect('mongodb://localhost/test');
    }
  })
  after(function(done) {
    allDone = true;
    mongoose.disconnect();
    done();
  });
  describe('User auth', function() {
    this.timeout(50000);
    it('should logged in and get jwt from /api/users/login', function(done) {
      var user = {
        username : 'admin',
        password : 'admin'
      }
      server.inject({
        method: 'POST',
        url: '/api/users/login',
        payload : user
      }, function(response) {
        profileModel.findOne({email:user.email}, function(err, profile){
          if (err) return done(err);
          response.result.must.be.an.object();
          response.result.success.must.equal(true);
          response.headers.token.must.be.exist();
          response.headers.current_user.must.exist();
          response.headers.current_user.toString().must.equal(profile._id.toString());
          response.headers.token.toString().length.should.greaterThan(0);
          token = response.headers.token.toString();
          user = {
            username : 'user',
            password : 'admin'
          }
          server.inject({
            method: 'POST',
            url: '/api/users/login',
            payload : user
          }, function(response) {
            token2 = response.headers.token.toString();
            done();
          })
        })
      });
    });
  });
  describe('List', function() {
    it('should be able to list the categories', function(done) {
      var path = '/api/categories';
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.total.must.equal(9);
        response.result.page.must.equal(1);
        response.result.limit.must.equal(10);
        response.result.data.length.must.equal(9);
        for (var i in response.result.data) {
          response.result.data[i].name.must.exist();
          response.result.data[i]._id.must.exist();
        }
        id = response.result.data[0]._id;
        done();
      });
    });
    it('should be able to list the categories without authorization', function(done) {
      var path = '/api/categories';
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.total.must.equal(9);
        response.result.page.must.equal(1);
        response.result.limit.must.equal(10);
        response.result.data.length.must.equal(9);
        for (var i in response.result.data) {
          response.result.data[i].name.must.exist();
          response.result.data[i]._id.must.exist();
        }
        done();
      });
    });
    it('should be able to list the categories with specific page and limit', function(done) {
      var path = '/api/categories?limit=3&page=2';
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.total.must.equal(9);
        response.result.page.must.equal(2);
        response.result.limit.must.equal(3);
        response.result.data.length.must.equal(3);
        for (var i in response.result.data) {
          response.result.data[i].name.must.exist();
          response.result.data[i]._id.must.exist();
        }
        done();
      });
    });
    it('should be able to list the categories with invalid page value, return empty array', function(done) {
      var path = '/api/categories?limit=3&page=10';
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.total.must.equal(9);
        response.result.page.must.equal(10);
        response.result.limit.must.equal(3);
        response.result.data.length.must.equal(0);
        done();
      });
    });
    it('should not be able to list categories with invalid query', function(done) {
      var path = '/api/categories?invalid=query';
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.statusCode.must.equal(400);
        response.result.error.must.equal('Bad Request');
        done();
      });
    });
  });
  describe('Read', function() {
    it('should be able to get a category', function(done) {
      var path = '/api/category/' + id;
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
        response.result._id.toString().must.equal(id.toString());
        response.result.name.must.equal('Pariwisata');
        done();
      });
    });
    it('should not be able to get a category with invalid id', function(done) {
      var path = '/api/category/' + id.toString().substr(0,-1) + 'a';
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.statusCode.must.equal(404);
        response.result.error.must.equal('Not Found');
        done();
      });
    });
    it('should not be able to get a category with invalid id', function(done) {
      var path = '/api/category/' + id.toString().substr(0,-1) + '0';
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.statusCode.must.equal(404);
        response.result.error.must.equal('Not Found');
        done();
      });
    });
  });
  describe('Create', function() {
    it('should be able to create a category (with token)', function(done) {
      var path = '/api/categories';
      server.inject({
        url: path,
        headers : { Authorization : token },
        method: 'POST',
        payload : {
          name : 'NewCategory',
        }
      }, function(response) {
        response.result._id.toString().must.exist();
        response.result.name.must.equal('NewCategory');
        id = response.result._id.toString();
        done();
      });
    });
    it('should not be able to create a category with non-admin privilege', function(done) {
      var path = '/api/categories';
      server.inject({
        url: path,
        headers : { Authorization : token2 },
        method: 'POST',
        payload : {
          name : 'NewCategory',
        }
      }, function(response) {
        response.result.statusCode.must.equal(401);
        response.result.error.must.equal('Unauthorized');
        done();
      });
    });
    it('should not be able to create category without token', function(done) {
      var path = '/api/categories';
      server.inject({
        url: path,
        method: 'POST',
        payload : {
          name : 'NewCategory',
        }
      }, function(response) {
        response.result.statusCode.must.equal(401);
        response.result.error.must.equal('Unauthorized');
        done();
      });
    });
    it('should not be able to create category with invalid additional payload', function(done) {
      var path = '/api/categories';
      server.inject({
        url: path,
        headers : { Authorization : token },
        method: 'POST',
        payload : {
          name : 'NewCategory',
          invalid : 'field',
        }
      }, function(response) {
        response.result.statusCode.must.equal(400);
        response.result.error.must.equal('Bad Request');
        done();
      });
    });
  });
  describe('Update', function() {
    it('should be able to update a category', function(done) {
      var path = '/api/category/' + id;
      server.inject({
        url: path,
        headers : { Authorization : token },
        method: 'POST',
        payload : {
          name : 'OldCategory',
          _id : id
        }
      }, function(response) {
        response.result._id.toString().must.equal(id.toString());
        response.result.updatedAt.toString().must.exist();
        response.result.name.must.equal('OldCategory');
        done();
      });
    });
    it('should not be able to update a category with non-admin privilege', function(done) {
      var path = '/api/category/' + id;
      server.inject({
        url: path,
        headers : { Authorization : token2 },
        method: 'POST',
        payload : {
          name : 'OldCategory',
          _id : id
        }
      }, function(response) {
        response.result.statusCode.must.equal(401);
        response.result.error.must.equal('Unauthorized');
        done();
      });
    });
    it('should not be able to update a category without token', function(done) {
      var path = '/api/category/' + id.substr(0,-1) + '0';
      server.inject({
        url: path,
        headers : { Authorization : token },
        method: 'POST',
        payload : {
          name : 'OldCategory',
          _id : id
        }
      }, function(response) {
        response.result.statusCode.must.equal(404);
        response.result.error.must.equal('Not Found');
        done();
      });
    });
    it('should not be able to update a category without token', function(done) {
      var path = '/api/category/' + id;
      server.inject({
        url: path,
        method: 'POST',
        payload : {
          name : 'OldCategory',
          _id : id
        }
      }, function(response) {
        response.result.statusCode.must.equal(401);
        response.result.error.must.equal('Unauthorized');
        done();
      });
    });
    it('should not be able to update a category without _id', function(done) {
      var path = '/api/category/' + id;
      server.inject({
        url: path,
        headers : { Authorization : token },
        method: 'POST',
        payload : {
          name : 'OldCategory',
        }
      }, function(response) {
        response.result.statusCode.must.equal(400);
        response.result.error.must.equal('Bad Request');
        done();
      });
    });
    it('should not be able to update a category without _id', function(done) {
      var path = '/api/category/' + id;
      server.inject({
        url: path,
        headers : { Authorization : token },
        method: 'POST',
        payload : {
          name : 'OldCategory',
          _id : id,
          invalid : 'field',
        }
      }, function(response) {
        response.result.statusCode.must.equal(400);
        response.result.error.must.equal('Bad Request');
        done();
      });
    });
  });
  describe('Delete', function() {
    it('should be able to delete a category', function(done) {
      var path = '/api/category/' + id;
      server.inject({
        url: path,
        headers : { Authorization : token },
        method: 'DELETE',
      }, function(response) {
        response.result.success.must.equal(true);
        done();
      });
    });
    it('should not be able to delete a category with non-admin privilege', function(done) {
      var path = '/api/category/' + id;
      server.inject({
        url: path,
        headers : { Authorization : token2 },
        method: 'DELETE',
      }, function(response) {
        response.result.statusCode.must.equal(401);
        response.result.error.must.equal('Unauthorized');
        done();
      });
    });
    it('should not be able to delete a category with invalid id', function(done) {
      var path = '/api/category/' + id.toString().substr(0,-1) + '0';
      server.inject({
        url: path,
        headers : { Authorization : token },
        method: 'DELETE',
      }, function(response) {
        response.result.statusCode.must.equal(404);
        response.result.error.must.equal('Not Found');
        done();
      });
    });
    it('should not be able to delete a category without token', function(done) {
      var path = '/api/category/' + id;
      server.inject({
        url: path,
        method: 'DELETE',
      }, function(response) {
        response.result.statusCode.must.equal(401);
        response.result.error.must.equal('Unauthorized');
        done();
      });
    });
  });
});
