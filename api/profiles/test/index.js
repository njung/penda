var mongoose = require("mongoose");
var server = require(__dirname + "/../../../index");
var model = require(__dirname + "/../index").model();
var passportLocalMongoose = require("passport-local-mongoose");
var fs = require("fs");
var hat = require("hat");
var _ = require("lodash");
var User = require("../../00-user").model();
var Profile = require("../../profiles").model();
var async = require("async");
var FormData = require("form-data");
var streamToPromise = require("stream-to-promise");
var faker = require("faker");
var uuid = require("uuid");
var crypto = require("crypto");
require("must");

var token, token2;
var activatedUserId;
var deactivatedUserId;
var avatar, avatarHash;

var prefix = "http://localhost:7000";

describe("Profiles", function() {
  this.timeout(100000);
  var allDone = false;
  before(function(done){
    var afterConnect = function() {
      async.series([
        function(cb) {
          User.remove(function(err){
            if (err) done(err);
            cb(); 
          });
        },
        function(cb) {
          var users;
          fs.readFile(__dirname + "/users.json", "utf8", function(err, data) {
            if (err) done(err);
            users = JSON.parse(data);
            async.each(users, function(user, callback) {
              var newUser = new User(user);
              newUser.save(function(err, result){
                if (err) done(err);
                var newProfile = new Profile({
                  username : users[0].username,
                  email : users[0].username,
                  fullName : "User Number One X",
                  role : "admin",
                  userId : result._id,
                });
                newProfile.save(function(err, result){
                  if (err) done(err);
                  activatedUserId = result._id;
                  callback()
                })
              })
            }, function(err) {
              server.inject({
                method: "POST",
                url: "/api/users/login",
                payload : {
                  username : "user1x@users.com",
                  password : "admin"
                },
              }, function(response) {
                token = response.headers.token;
          
                var users = ["3","4","5","6","7","8","9","10","11","12", "13"];
                async.each(users, function(i, callback) {
                  var path = "/api/users";
                  var user = {
                    username : "user" + i + "@users.com",
                    password : "pass" + i,
                    fullName : "User Number " + i,
                    role : "admin"
                  }
                  server.inject({
                    headers : { Authorization : token },
                    url: path,
                    method: "POST",
                    payload : user,
                  }, function(response) {
                    callback();
                  });
                }, function(err) {
                  if (err) done(err);
                  cb()
                })
              });
            });
          });
        }
      ], function(err) {
        done();
      })
    }
    mongoose.connection.on("connected", function() {
      if (allDone) return;
      afterConnect();
    });
    if (!mongoose.connection.readyState) {
      mongoose.connect("mongodb://localhost/test");
    }
  });
  after(function(done) {
    allDone = true;
    mongoose.disconnect();
    done();
  });
  describe("User create", function() {
    this.timeout(50000);
    it("should create new user to /api/users without any error", function(done) {
      var path = "/api/user-register";
      var user = {
        username : "user2@users.com",
        email : "user2@users.com",
        password : "pass2",
        repeatPassword : "pass2",
        fullName : "User Number Two",
      }
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "POST",
        payload : user,
      }, function(response) {
        response.result.must.be.an.object();
        response.result._id.must.exist();
        response.result.email.must.exist();
        response.result.fullName.must.exist();
        response.result.role.must.exist();
        response.result.userId.must.exist();
        response.result.email.must.equal(user.email);
        response.result.fullName.must.equal(user.fullName);
        response.result.role.must.equal('user');
        deactivatedUserId = response.result._id;
        done();
      });
    });
    it("should confirm newly created user /api/users/confirm/{code} without any error", function(done) {
      Profile.findOne({email:"user2@users.com"}, function(err, result) {
        if (err) return done(err);
        var code = result.activationCode;
        var path = "/api/users/confirm/" + code;
        server.inject({
          url: path,
          method: "GET",
        }, function(response) {
          response.result.must.be.an.object();
          response.result.success.must.equal(true);
          done();
        });
      })
    });
    it("should fail to confirm newly created user with invalid code /api/users/confirm/{code}", function(done) {
      var code = uuid.v4();
      var path = "/api/users/confirm/" + code;
      server.inject({
        url: path,
        method: "GET",
      }, function(response) {
        response.result.must.be.an.object();
        response.result.error.must.equal("Not Found");
        response.result.message.must.exist();
        response.result.statusCode.must.equal(404);
        done();
      });
    });
    it("should fail to create new user with empty payload, /api/users", function(done) {
      var path = "/api/users";
        server.inject({
          headers : { Authorization : token },
          url: path,
          method: "POST",
          payload : {},
        }, function(response) {
          response.result.must.be.an.object();
          response.result.error.must.equal("Bad Request");
          response.result.message.must.exist();
          response.result.validation.must.exist();
          response.result.statusCode.must.equal(400);
          done();
        });
    });
    it("should fail to create new user if the current user is not an admin, /api/users", function(done) {
      Profile.findOne({_id:activatedUserId}, function(err, user){
        if (err) done(err);
        user.role = "manager";
        user.save(function(err, result) {
          var path = "/api/user-register";
          var user = {
            email : "user2x@users.com",
            username : "user2x@users.com",
            fullName : "User Number Two",
            password : "pass2",
            repeatPassword : "pass2",
          }
          server.inject({
            headers : { Authorization : token },
            url: path,
            method: "POST",
            payload : user,
          }, function(response) {
            response.result.must.be.an.object();
            response.result.error.must.exist();
            response.result.message.must.exist();
            response.result.error.must.equal("Unauthorized");
            response.result.message.must.equal("Failed to register new user");
            response.result.statusCode.must.equal(401);

            // Set it back as admin so it can be reused again.
            Profile.findOne({_id:activatedUserId}, function(err, user){
              if (err) done(err);
              user.role = "admin";
              user.save(function(err, result) {
                done();
              });
            });
          });
        })
      });
    });
    it("should fail to post new user if it breaks validation role", function(done) {
      var path = "/api/users";
      var user = {
        username : "user101@users.com",
      }
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "POST",
        payload : user,
      }, function(response) {
        response.result.must.be.an.object();
        response.result.error.must.equal("Bad Request");
        response.result.message.must.exist();
        response.result.validation.must.exist();
        response.result.statusCode.must.equal(400);
        done();
      });
    });
  });
  describe("User get", function() {
    this.timeout(50000);
    it("should get user list from /api/users", function(done) {
      var path = "/api/users";
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "GET",
      }, function(response) {
        response.result.must.be.an.object();
        response.result.page.must.equal(0);
        response.result.limit.must.equal(10);
        response.result.data.must.be.an.array();
        (response.result.data.length).must.least(1);
        response.result.data.must.have.length(4);
        response.result.data[0].must.exist();
        async.each(response.result.data, function(item, cb){
          item._id.must.not.be.null();
          cb();
        }, function(err){
          done();
        })
      });
    });
    it("should be able get user list with invalid jwt since the endpoint is publicly open", function(done) {
      var path = "/api/users";
      server.inject({
        headers : { Authorization : token + 'x' },
        url: path,
        method: "GET",
      }, function(response) {
        response.result.must.be.an.object();
        response.result.page.must.equal(0);
        response.result.limit.must.equal(10);
        response.result.data.must.be.an.array();
        (response.result.data.length).must.least(1);
        response.result.data.must.have.length(4);
        response.result.data[0].must.exist();
        async.each(response.result.data, function(item, cb){
          item._id.must.not.be.null();
          cb();
        }, function(err){
          done();
        })
      });
    });
    it("should get 2 item by limit from /api/users?limit=2", function(done) {
      var path = "/api/users?limit=2";
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "GET",
      }, function(response) {
        response.result.must.be.an.object();
        response.result.page.must.equal(0);
        response.result.limit.must.equal(2);
        response.result.data.must.be.an.array();
        (response.result.data.length).must.least(1);
        response.result.data.must.have.length(2);
        response.result.data[0].must.exist();
        async.each(response.result.data, function(item, cb){
          item._id.must.not.be.null();
          cb();
        }, function(err){
          done();
        })
      });
    });
    it("should get 2 item from page 2 by query /api/users?limit=2&page=2", function(done) {
      var path = "/api/users?limit=2&page=2";
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "GET",
      }, function(response) {
        response.result.must.be.an.object();
        response.result.limit.must.equal(2);
        response.result.page.must.equal(1);
        response.result.data.must.be.an.array();
        (response.result.data.length).must.least(1);
        response.result.data.must.have.length(2);
        response.result.data[0].must.exist();
        async.each(response.result.data, function(item, cb){
          item._id.must.not.be.null();
          cb();
        }, function(err){
          done();
        })
      });
    });
    it("should get an user by id, query /api/user/{id}", function(done) {
      var path = "/api/user-register";
      var user = {
        username : "user106@users.com",
        email : "user106@users.com",
        password : "pass106",
        repeatPassword : "pass106",
        fullName : "User Number 106",
      }
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "POST",
        payload : user,
      }, function(response) {
        response.result.must.be.an.object();
        response.result._id.must.exist();
        var id = response.result._id;
        var path = "/api/user/" + id;
        server.inject({
          headers : { Authorization : token },
          url: path,
          method: "GET",
        }, function(response) {
          response.result.must.be.an.object();
          response.result.email.must.exist();
          response.result._id.must.exist();
          response.result.email.must.equal("user106@users.com");
          response.result._id.toString().must.equal(id.toString());
          done();
        });
      });
    });
    it("should fail to get an user by invalid id, query /api/user/{id}", function(done) {
      var path = "/api/user/000000000000000000000001";
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "GET",
      }, function(response) {
        response.result.must.be.an.object();
        response.result.error.must.equal("Not Found");
        response.result.message.must.exist();
        response.result.statusCode.must.equal(404);
        done();
      });
    });
    it("should fail to get an user by a non-object id, query /api/user/{id}", function(done) {
      var path = "/api/user/ok";
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "GET",
      }, function(response) {
        response.result.must.be.an.object();
        response.result.error.must.equal("Not Found");
        response.result.message.must.exist();
        response.result.statusCode.must.equal(404);
        done();
      });
    });
  });
  // TODO : Skipped if syncUser is active.
  describe("User update", function() {
    /* before(function(done) { */
    /*   server.inject({ */
    /*     method: "POST", */
    /*     url: "/api/users/login", */
    /*     payload : { */
    /*       username : "admin", */
    /*       password : "admin" */
    /*     }, */
    /*   }, function(response) { */
    /*     token2 = response.headers.token; */
    /*     done(); */
    /*   }) */
    /* }) */
    this.timeout(500000);
    it("should update profile of an user by query /api/user/{id}", function(done) {
      var path = "/api/user/" + activatedUserId;
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "POST",
        payload : {
          fullName : "User Number Two Edited",
        }
      }, function(response) {
        // Check changed profile data
        response.result.must.be.an.object();
        response.result._id.must.exist();
        response.result.email.must.exist();
        response.result.fullName.must.exist();
        response.result.role.must.exist();
        response.result.userId.must.exist();
        response.result.fullName.must.equal("User Number Two Edited");
        done();
      });
    });
    it("should update password /api/user/{id}", function(done) {
      var path = "/api/user/" + activatedUserId + "/set-password";
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "POST",
        payload : {
          currentPassword : "admin",
          password : "changed"
        }
      }, function(response) {
        // Check changed profile data
        response.result.must.be.an.object();
        response.result.success.must.exist();
        response.result.success.must.equal(true);
        done();
      });
    });
    it("should fail to update password with wrong current password, /api/user/{id}", function(done) {
      var path = "/api/user/" + activatedUserId + "/set-password";
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "POST",
        payload : {
          currentPassword : "wrong",
          password : "changed"
        }
      }, function(response) {
        // Check changed profile data
        response.result.must.be.an.object();
        response.result.success.must.exist();
        response.result.success.must.equal(false);
        done();
      });
    });
    it("should fail to update password with wrong current password, /api/user/{id}", function(done) {
      var path = "/api/user/" + hat() + "/set-password";
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "POST",
        payload : {
          currentPassword : "changed",
          password : "changedAgain"
        }
      }, function(response) {
        // Check changed profile data
        response.result.must.be.an.object();
        response.result.error.must.equal("Not Found");
        response.result.message.must.exist();
        response.result.statusCode.must.equal(404);
        done();
      });
    });
    it("should able to update profile of other user by query /api/user/{id}", function(done) {
      var path = "/api/user-register";
      var user = {
        fullName : "Other",
        username : "otheruser",
        email : "otheruser@users.com",
        password : "otherpass",
        repeatPassword : "otherpass",
      }
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "POST",
        payload : user,
      }, function(response) { 
        response.result.must.be.an.object();
        response.result.role.must.exist();
        response.result._id.must.exist();
        response.result.email.must.exist();
        response.result.fullName.must.exist();
        response.result.email.must.equal(user.email);
        var id = response.result._id;
        var path = "/api/user/" + id;
        server.inject({
          headers : { Authorization : token },
          url: path,
          method: "POST",
          payload : {
            fullName : "Other User Edited",
          }
        }, function(response) {
          response.result.must.be.an.object();
          response.result.email.must.exist();
          response.result.fullName.must.exist();
          response.result.role.must.exist();
          response.result.userId.must.exist();
          var path = "/api/user/" + id;
          server.inject({
            headers : { Authorization : token },
            url: path,
            method: "GET",
          }, function(response) {
            response.result.must.be.an.object();
            response.result.email.must.exist();
            response.result._id.must.exist();
            response.result.email.must.equal("otheruser@users.com");
            response.result.fullName.must.equal("Other User Edited");
            response.result._id.toString().must.equal(id.toString());
            done();
          });
        });
      });
    });
    it("should fail to update profile if payload contains email, /api/user/{id}", function(done) {
      var path = "/api/user/" + activatedUserId;
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "POST",
        payload : {
          email : faker.internet.email(),
        }
      }, function(response) {
        response.result.must.be.an.object();
        response.result.error.must.equal("Bad Request");
        response.result.message.must.exist();
        response.result.statusCode.must.equal(400);
        done();
      });
    });
    it("should fail to update profile of an user with invalid id by query /api/user/{id}", function(done) {
      var path = "/api/user/000000000000000000000001";
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "POST",
        payload : {
          fullName : "User Number Two Edited Again",
        }
      }, function(response) {
        response.result.must.be.an.object();
        response.result.error.must.equal("Not Found");
        response.result.message.must.exist();
        response.result.statusCode.must.equal(404);
        done();
      });
    });
    it("should fail to update profile of an user with invalid non-object id by query /api/user/{id}", function(done) {
      var path = "/api/user/ok";
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "POST",
        payload : {
          fullName : "User Number Two Edited Again 2th",
        }
      }, function(response) {
        response.result.must.be.an.object();
        response.result.error.must.equal("Not Found");
        response.result.message.must.exist();
        response.result.statusCode.must.equal(404);
        done();
      });
    });
    it("should fail to update profile of an user with empty payload by query /api/user/{id}", function(done) {
      var path = "/api/user/" + activatedUserId;
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "POST",
        payload : {}
      }, function(response) {
        response.result.must.be.an.object();
        response.result.error.must.equal("Bad Request");
        response.result.message.must.exist();
        response.result.message.must.equal("Payload should not be empty");
        response.result.statusCode.must.equal(400);
        done();
      });
    });
    it("should fail to change its own role by query /api/user/{id}", function(done) {
      var path = "/api/user/" + activatedUserId;
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "POST",
        payload : {
          role : "manager"
        }
      }, function(response) {
        response.result.must.be.an.object();
        response.result.error.must.exist();
        response.result.message.must.exist();
        response.result.error.must.equal("Bad Request");
        response.result.statusCode.must.equal(400);
        done();
      });
    });
    it("should fail to change role of other user if the current user is not an admin, by query /api/user/{id}", function(done) {
      Profile.findOne({_id:activatedUserId}, function(err, user){
        if (err) done(err);
        user.role = "manager";
        user.save(function(err, result) {
          var path = "/api/user/" + deactivatedUserId;
          var user = {
            role : "manager"
          }
          server.inject({
            headers : { Authorization : token },
            url: path,
            method: "POST",
            payload : user,
          }, function(response) {
            response.result.must.be.an.object();
            response.result.error.must.exist();
            response.result.message.must.exist();
            response.result.error.must.equal("Bad Request");
            response.result.statusCode.must.equal(400);
            // Set it back as admin so it can be reused again.
            Profile.findOne({_id:activatedUserId}, function(err, user){
              if (err) done(err);
              user.role = "admin";
              user.save(function(err, result) {
                done();
              });
            });
          });
        }) 
      })
    });
  });
  describe("User delete", function() {
    this.timeout(50000);
    it("should delete an item by query /api/user/{id}", function(done) {
      var path = "/api/user-register";
      var user = {
        username : "user104",
        email : "user104@users.com",
        password : "pass104",
        repeatPassword : "pass104",
        fullName : "User Number One Hundred and Four",
      }
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "POST",
        payload : user,
      }, function(response) { 
        console.log(response.result);
        response.result.must.be.an.object();
        response.result._id.must.exist();
        response.result.email.must.exist();
        response.result.email.must.equal(user.email);
        var path = "/api/user/" + response.result._id;
        server.inject({
          headers : { Authorization : token },
          url: path,
          method: "DELETE",
        }, function(response) {
          response.result.must.be.an.object();
          response.result.success.must.equal(true);
          done();
        });
      });
    });
    it("should fail to delete an item with invalid id by query /api/user/{id}", function(done) {
      var path = "/api/user/000000000000000000000001";
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "DELETE",
      }, function(response) {
        response.result.must.be.an.object();
        response.result.error.must.exist();
        response.result.message.must.exist();
        response.result.error.must.equal("Not Found");
        response.result.message.must.exist();
        response.result.statusCode.must.equal(404);
        done();
      });
    });
    it("should fail to delete an item with invalid id (non ObjectId string) by query /api/user/{id}", function(done) {
      var path = "/api/user/ok";
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: "DELETE",
      }, function(response) {
        response.result.must.be.an.object();
        response.result.error.must.equal("Not Found");
        response.result.message.must.exist();
        response.result.statusCode.must.equal(404);
        done();
      });
    });
  });
});
