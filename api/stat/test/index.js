var server = require(__dirname + '/../../../index');
var mongoose = require('mongoose');
var fs = require('fs');
var profileModel = require(__dirname + '/../../../api/profiles/index').model();
require('must');

var port = '3000';
if (process.env.PORT) port = process.env.PORT;
var prefix = 'http://localhost:' + port;
var token, token2, id;

describe('RSS', function() {
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
  describe('Stat', function() {
    it('should be able to get stat summaries', function(done) {
      var path = '/api/stat/sum';
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.row.must.exist();
        response.result.dataset.must.exist();
        response.result.category.must.exist();
        done();
      });
    });
    it('should be able to get complete stat', function(done) {
      var path = '/api/stat/complete';
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.byCategory.must.exist();
        response.result.byUploader.must.exist();
        response.result.byCategory.length.should.greaterThan(0);
        response.result.byUploader.length.should.greaterThan(0);
        done();
      });
    });
  });
});
