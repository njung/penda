var server = require(__dirname + "/../../../index");
var mongoose = require("mongoose");
var server = require(__dirname + "/../../../index");
var model = require(__dirname + "/../index").model();
var passportLocalMongoose = require("passport-local-mongoose");
var fs = require("fs");
var _ = require("lodash");
var uuid = require("uuid");
var moment = require("moment");
var async = require("async");
var generateUser = require(__dirname + "/../../../api/00-user/index").generateUser;
var profileModel = require(__dirname + "/../../../api/profiles/index").model();
var should = require('should');
require("must");

var port = "3000";
if (process.env.PORT) port = process.env.PORT;
var prefix = "http://localhost:" + port;
var token;

describe("User", function() {
  this.timeout(300000);
  var allDone = false;
  before(function(done){
    mongoose.connection.on("connected", function() {
      if (allDone) return;
        done();
    });
    if (!mongoose.connection.readyState) {
      mongoose.connect("mongodb://localhost/test");
    }
  })
  after(function(done) {
    allDone = true;
    mongoose.disconnect();
    done();
  });
  describe("User auth", function() {
    this.timeout(50000);
    it("should logged in and get jwt from /api/users/login", function(done) {
      var user = {
        username : "admin",
        password : "admin"
      }
      server.inject({
        method: "POST",
        url: "/api/users/login",
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
          done();
        })
      });
    });
    it("should failed to login with invalid credentials from /api/users/login", function(done) {
      server.inject({
        method: "POST",
        url: "/api/users/login",
        payload : {
          username : "auth1@users.com",
          password : "wrongPassword"
        },
      }, function(response) {
        response.result.must.be.an.object();
        response.result.error.must.exist();
        response.result.message.must.exist();
        response.result.statusCode.must.exist();
        response.result.error.must.equal("Unauthorized");
        response.result.message.must.equal("Unknown credentials");
        response.result.statusCode.must.equal(401);
        done();
      });
    });
    it("should logged out by query /api/users/logout", function(done) {
      var path = "/api/users/logout";
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "GET",
      }, function(response) {
        response.statusCode.must.equal(200);
        done();
      });
    });
    it("should logged out with invalid credentials by query /api/users/logout", function(done) {
      var path = "/api/users/logout";
      server.inject({
        headers : { Authorization : token + 'x' },
        url: path,
        method: "GET",
      }, function(response) {
        response.result.must.be.an.object();
        response.result.error.must.exist();
        response.result.message.must.exist();
        response.result.statusCode.must.exist();
        response.result.error.must.equal("Unauthorized");
        response.result.message.must.equal("Invalid token");
        response.result.statusCode.must.equal(401);
        done();
      });
    });
  });
});
