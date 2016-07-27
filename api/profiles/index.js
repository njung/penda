var boom = require('boom');
var mongoose = require("mongoose");
var Joi = require("joi");
var _ = require("lodash");
var uuid = require("uuid");
var Grid = require("gridfs-stream");
var parse = require("mongoose-parse");
var moment = require('moment');
Grid.mongo = mongoose.mongo;

var User = require("../00-user");
var Email = require("../email");

var schema = {
  fullName : Joi.string().required(),
  email : Joi.string().email().required(),
  password : Joi.string().required(),
}

var registerSchema = {
  fullName : Joi.string().required(),
  email : Joi.string().email().required(),
  password : Joi.string().required(),
  repeatPassword : Joi.string().required(),
}

var updateSchema = {
  fullName : Joi.string().optional(),
  email : Joi.forbidden(),
}

var passwordSchema = {
  currentPassword : Joi.string().required(),
  password : Joi.string().required(),
}

var profileModel = function() {
  var registered = false;
  var m;
  try {
    m = mongoose.model("Profiles");
    registered = true;
  } catch(e) {
  }

  if (registered) return m;
  var schema = {
    fullName : String,
    email : {
      type : String,
      unique : true
    },
    rule : String,
    joinedSince : Date,
    activationCode : String,
    userId : String,
    avatar: mongoose.Schema.ObjectId,
  }

  var s = new mongoose.Schema(schema);
  m = mongoose.model("Profiles", s);
  return m;
}

var passwordRecoveryModel = function() {
  var registered = false;
  var m;
  try {
    m = mongoose.model("PasswordRecovery");
    registered = true;
  } catch(e) {
  }

  if (registered) return m;
  var schema = {
    recoveryCode : String,
    profileId : String,
    userId : String,
    email : String,
    isActive : Boolean
  }

  var s = new mongoose.Schema(schema);
  m = mongoose.model("PasswordRecovery", s);
  return m;
}

var Profiles = function(server, options, next) {
  this.server = server;
  this.options = options || {};
  this.registerEndPoints();
}

Profiles.prototype.registerEndPoints = function() {
  var self = this;
  self.server.route({
    method: "GET",
    path: "/api/users",
    config : {
    },
    handler: function(request, reply) {
      self.list(request, reply);
    }
  });
  self.server.route({
    method: "POST",
    path: "/api/user-register",
    handler: function(request, reply) {
      self.register(request, reply);
    },
    config : {
      validate : {
        payload: Joi.object(registerSchema)
      }
    }
  });
  self.server.route({
    method: "POST",
    path: "/api/users",
    handler: function(request, reply) {
      self.register(request, reply);
    },
    config : {
      validate : {
        payload: Joi.object(schema)
      }
    }
  });
  self.server.route({
    method: "GET",
    path: "/api/users/confirm/{code}",
    config : {
      auth: false,
    },
    handler: function(request, reply) {
      self.confirm(request, reply);
    }
  });
  self.server.route({
    method: "POST",
    path: "/api/user/{id}",
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
    method: "POST",
    path: "/api/user/{id}/set-password",
    config : {
      validate : {
        payload: Joi.object(passwordSchema)
      }
    },
    handler: function(request, reply) {
      self.setPassword(request, reply);
    }
  });
  self.server.route({
    method: "GET",
    path: "/api/user/{id}",
    config : {
    },
    handler: function(request, reply) {
      self.get(request, reply);
    }
  });
  self.server.route({
    method: "DELETE",
    path: "/api/user/{id}",
    config : {
    },
    handler: function(request, reply) {
      self.delete(request, reply);
    }
  });

  // Avatar
  self.server.route({
    method: "POST",
    path: "/api/user/{id}/avatar",
    config : {
      payload: {
        maxBytes: 1048576 * 10, // 10MB
        output: "stream",
        parse: true
      }
    },
    handler: function(request, reply) {
      self.uploadAvatar(request, reply);
    }
  });
  self.server.route({
    method: "GET",
    path: "/api/user/{id}/avatar",
    config : {
      auth: false,
    },
    handler: function(request, reply) {
      self.getAvatar(request, reply);
    }
  });
  self.server.route({
    method: "DELETE",
    path: "/api/user/{id}/avatar",
    config : {
    },
    handler: function(request, reply) {
      self.removeAvatar(request, reply);
    }
  });
  
  // Password recovery
  self.server.route({
    method: "POST",
    path: "/api/users/password-recovery",
    config : {
      auth: false,
    },
    handler: function(request, reply) {
      self.passwordRecovery(request, reply);
    }
  });
  self.server.route({
    method: "GET",
    path: "/api/users/check-recovery-code/{code}",
    config : {
      auth: false,
    },
    handler: function(request, reply) {
      self.checkRecoveryCode(request, reply);
    }
  });
  self.server.route({
    method: "GET",
    path: "/api/users/count",
    config : {
      auth: false,
    },
    handler: function(request, reply) {
      self.count(request, reply);
    }
  });
  self.server.route({
    method: "POST",
    path: "/api/users/set-password-recovery/{code}",
    config : {
      auth: false,
    },
    handler: function(request, reply) {
      self.setPasswordRecovery(request, reply);
    }
  });
}

/**
  * @api {get} /api/users List users
  * @apiName listUsers
  * @apiGroups Users
  *
  * @apiParam {Number} [limit] Number of the result per page
  * @apiParam {Number} [page] Starting page to query
  *
  * @apiSuccess {Object} result Result object
  * @apiSuccess {Number} result.total Total number of result
  * @apiSuccess {Number} result.page Current page
  * @apiSuccess {Object[]} result.data result.data List of users
  *
  * @apiError unauthorized {Object} result Result object
  * @apiError unauthorized {Object} result.statusCode 401
  * @apiError unauthorized {Object} result.error Error code
  * @apiError unauthorized {Object} result.message Description about the error
  *
**/

Profiles.prototype.list = function(request, reply) {
  var self = this;
  var defaultLimit = 10;
  var limit = request.query.limit || defaultLimit;
  limit = parseInt(limit);
  var page = request.query.page || 1;
  page--;
  page = parseInt(page);

  var q = {}
  var count;
  
  if (request.query.rule) q.rule = request.query.rule;
  if (request.query.country) q.country = request.query.country;
  
  // count all record
  profileModel()
    .count(q)
    .exec(function(err, result){
    if (err) {
      return reply(err).statusCode = 400;
    }
    count = result;
    var query = profileModel()
      .find(q)
      .limit(limit)
      .skip(limit * page);
    query
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

Profiles.prototype.count = function(request, reply) {
  var self = this;
  var increaser = 400;
  // count all record
  profileModel()
    .count()
    .exec(function(err, result){
    if (err) {
      return reply(err).statusCode = 400;
    }
      reply(result + increaser).type("application/json");
    });
}

Profiles.prototype.checkRecoveryCode = function(request, reply) {
  var self = this;
  passwordRecoveryModel()
    .findOne({recoveryCode:request.params.code, isActive:true})
    .exec(function(err, result){
    if (err) return reply(parse(err));
    if (result) {
      reply({success:true});
    } else {
      reply({success:false}).code(404);
    }
  });
}

Profiles.prototype.setPasswordRecovery = function(request, reply) {
  console.log(request.payload);
  var self = this;
  passwordRecoveryModel()
    .findOne({recoveryCode:request.params.code, isActive:true})
    .exec(function(err, result){
    if (err) return reply(parse(err));
    if (result) {
      console.log(result);
      User.class.setPasswordRecovery(result.userId, request.payload.password, function(err, user) {
        if (err) return reply(parse(err));
        result.isActive = false;
        result.save(function(err, result){
          reply({success:true});
        })
      });
    } else {
      reply({success:false});
    }
  });
  
}


Profiles.prototype.passwordRecovery = function(request, reply) {
  console.log("password recovery endpoint");
  var self = this;
  passwordRecoveryModel()
    .findOne({email: request.payload.email, isActive : true})
    .exec(function(err, result) {
      if (err) return reply(parse(err));
      if (!result) {
        profileModel()
          .findOne({email: request.payload.email})
          .lean()
          .exec(function(err, result){
            if (err) return reply(parse(err));
            if (!result) {
              return reply({
                error: "Not Found", 
                statusCode: 404, 
                message: "Invalid email address"
              }).code(404);
            }
            var recoveryCode = uuid.v4();
            passwordRecoveryModel()
              .create({
                email : request.payload.email,
                profileId : result._id,
                userId : result.userId,
                recoveryCode : recoveryCode,
                isActive : true
              }, function(err, result) {
                if (err) return reply(parse(err));
                reply({
                  success: true, 
                });
                Email.class.sendPasswordRecovery(request.payload.email, recoveryCode);
              })
          });
      } else {
        reply({
          success: true, 
        });
        Email.class.sendPasswordRecovery(request.payload.email, result.recoveryCode);
      } 
    });
}
/**
  * @api {post} /api/users Register new user
  * @apiName registerUser
  * @apiGroups Users
  *
  * @apiParam {String} email Email of the new user, used as username for login
  * @apiParam {String} fullname Full name of the new user
  * @apiParam {String} rule Rule of the new user, enums : admin, analyst, manager
  * @apiParam {String} [team] Team that assigned to the user
  *
  * All of the above params is required, except team.
  *
  * @apiSuccess {Object} result Result object
  * @apiSuccess {String} result.id Id of the new user
  * @apiSuccess {String} result.email Email of the new user;
  *
  * @apiError badRequest {Object} result Result object
  * @apiError badRequest {Object} result.statusCode 400
  * @apiError badRequest {Object} result.error Error code
  * @apiError badRequest {Object} result.message Description about the error
  * @apiError badRequest {String[]} result.validation.keys Arrays of the keys of the source which caused the error
  *
  * @apiError unauthorized {Object} result Result object
  * @apiError unauthorized {Object} result.statusCode 401
  * @apiError unauthorized {Object} result.error Error code
  * @apiError unauthorized {Object} result.message Description about the error
  *
  * @apiError notFound {Object} result Result object
  * @apiError notFound {Object} result.statusCode 404
  * @apiError notFound {Object} result.error Error code
  * @apiError notFound {Object} result.message Description about the error
  *
**/

Profiles.prototype.register = function(request, reply) {
  var self = this;
  console.log(request.payload);
  // Force to have 'user' rule
  request.payload.rule = 'user';
  request.payload.joinedSince = new Date();
  if (request.payload.password != request.payload.repeatPassword) {
    var err = new Error('Repeat password not matched');
    return reply(err).statusCode = 400;
  }
  console.log(request.auth);
  if (request.auth && request.auth.credentials) {
    console.log("registering new user by admin");
    profileModel()
      .findOne({userId: request.auth.credentials.userId})
      .exec(function(err, result) {
      if (err) {
        return reply(err).statusCode = 400;
      }
      if (result.rule == "admin") {
        request.isActive = true;
        User.class.create(request, function(err, result) {
          if (err) {
            return reply(err).statusCode = 400;
          } else {
            console.log(result);
            request.payload.userId = result.id;
            self.realRegister(request, function(err, profile) {
              if (err) return reply(err).statusCode = 500;
              reply(profile);
            });
          }
        })
      } else {
        return reply({
          error: "Unauthorized",
          message: "Failed to register new user",
          statusCode: 401
        }).code(401);
      }
    })
  } else {
    console.log("registering new user by anonym");
    request.payload.rule = "user";
    request.payload.country = "";
    User.class.create(request, function(err, result) {
      if (err) {
        return reply(err).statusCode = 400;
      } else {
        request.payload.userId = result.id;
        self.realRegister(request, function(err, profile) {
          if (err) return reply(err).statusCode = 500;
          reply(profile);
        });
      }
    })
  }
}

/**
  * @api {get} /api/users/confirm/{code} Confirm invitation
  * @apiName confirmUser
  * @apiGroups Users
  *
  * @apiParam {String} code Confirmation code that has been send by email to newly created user's email.
  *
  * @apiSuccess {Object} result Result object
  * @apiSuccess {Boolean} result.success Boolean state
  *
  * @apiError unauthorized {Object} result Result object
  * @apiError unauthorized {Object} result.statusCode 401
  * @apiError unauthorized {Object} result.error Error code
  * @apiError unauthorized {Object} result.message Description about the error
  *
  * @apiError notFound {Object} result Result object
  * @apiError notFound {Object} result.statusCode 404
  * @apiError notFound {Object} result.error Error code
  * @apiError notFound {Object} result.message Description about the error
**/

Profiles.prototype.confirm = function(request, reply) {
  var self = this;
  var io = request.server.plugins['hapi-io'].io;
  profileModel().findOne({activationCode : request.params.code}, function(err, result) {
    if (err) {
      return reply(err).statusCode = 400;
    }
    if (!result) {
      return reply({
        error: "Not Found", 
        statusCode: 404, 
        message: "User profile was not found"
      }).code(400);
    }
    var email = result.email;
    User.class.activate(result.userId, function(err, result) {
      if (err) {
        return reply(err).statusCode = 400;
      }
      // Get email
      Email.class.sendNewUserGreeting(email);
      reply({success: true})
    });
  })

}

/**
  * @api {post} /api/user/{id} Update existing user
  * @apiName updateUser
  * @apiGroups Users
  *
  * @apiParam {String} [fullname] Full name of the existing user
  * @apiparam {string} [rule] rule of the new user, enums : admin, analyst, manager
  * @apiParam {String} [team] Team that assigned to the user
  *
  * Not all of the above params is required
  * But the request should have at least one field to update
  *
  * @apiSuccess {Object} result Result object
  * @apiSuccess {String} result.success Boolean state
  *
  * @apiError badRequest {Object} result Result object
  * @apiError badRequest {Object} result.statusCode 400
  * @apiError badRequest {Object} result.error Error code
  * @apiError badRequest {Object} result.message Description about the error
  * @apiError badRequest {String[]} result.validation.keys Arrays of the keys of the source which caused the error
  *
  * @apiError unauthorized {Object} result Result object
  * @apiError unauthorized {Object} result.statusCode 401
  * @apiError unauthorized {Object} result.error Error code
  * @apiError unauthorized {Object} result.message Description about the error
  *
  * @apiError notFound {Object} result Result object
  * @apiError notFound {Object} result.statusCode 404
  * @apiError notFound {Object} result.error Error code
  * @apiError notFound {Object} result.message Description about the error

**/

Profiles.prototype.update = function(request, reply) {
  var self = this;
  var bogus = self.checkBogus(request.params.id);
  if (bogus.isBogus) {
    return reply(bogus.reply).statusCode = 404;
  }
  profileModel()
    .findOne({userId: request.auth.credentials.userId})
    .exec(function(err, result) {
    if (err) {
      return reply(err).statusCode = 400;
    }

    // This request could be done by the same user or the current logged user is an admin
    if (request.params.id == result._id
    || result.rule === "admin") {
      if (_.isEmpty(request.payload)) {
        return reply({
          error: "Bad Request", 
          statusCode: 400, 
          message: "Payload should not be empty"
        }).code(400);
      }

      // The rule modification of an user only could be done if the current logged user is an admin
      // TODO : 
      // rule user : same id, 
      // rule admin, same id, different id
      console.log(result.rule);
      console.log(request.payload.rule);
      /* if ((result.rule != "admin" && request.payload.rule) */
      /*   || (request.params.id == result._id && request.payload.rule!="admin") */
        /* || (request.params.id != result._id && result.rule=="user") */
        /* ){ */
      if (request.auth.credentials.rule==="user" 
        && (
            (result.rule != "admin" && request.payload.rule)
            || request.params.id != result._id 
            || request.payload.rule === "admin"
            || (result.rule === "admin")
            || (request.params.id != result._id && result.rule=="user")
          )
        ){
        return reply({
          error: "Unauthorized",
          message: "Failed to update user_",
          statusCode: 400
        }).code(400);
      }
      realUpdate(request, reply);
    } else {
      return reply({
        error: "Unauthorized",
        message: "Failed to update user",
        statusCode: 400
      }).code(400);
    }
  });
}

/**
  * @api {post} /api/user/{id}/set-password Set new password of existing user
  * @apiName setPasswordUser
  * @apiGroups Users
  *
  * @apiParam {String} currentPassword Current password
  * @apiParam {String} password New password
  *
  * @apiSuccess {Object} result Result object
  * @apiSuccess {String} result.success Boolean state
  *
  * @apiError badRequest {Object} result Result object
  * @apiError badRequest {Object} result.statusCode 400
  * @apiError badRequest {Object} result.error Error code
  * @apiError badRequest {Object} result.message Description about the error
  * @apiError badRequest {String[]} result.validation.keys Arrays of the keys of the source which caused the error
  *
  * @apiError unauthorized {Object} result Result object
  * @apiError unauthorized {Object} result.statusCode 401
  * @apiError unauthorized {Object} result.error Error code
  * @apiError unauthorized {Object} result.message Description about the error
  *
  * @apiError notFound {Object} result Result object
  * @apiError notFound {Object} result.statusCode 404
  * @apiError notFound {Object} result.error Error code
  * @apiError notFound {Object} result.message Description about the error

**/

Profiles.prototype.setPassword = function(request, reply) {
  var self = this;
  var bogus = self.checkBogus(request.params.id);
  if (bogus.isBogus) {
    return reply(bogus.reply).statusCode = 404;
  }
  profileModel()
    .findOne({userId: request.auth.credentials.userId})
    .exec(function(err, result) {
    if (err) {
      return reply(err).statusCode = 400;
    }

    // This request could be done by the same user or the current logged user is an admin
    if (request.params.id == result._id
    || result.rule == "admin") {
      if (_.isEmpty(request.payload)) {
        return reply({
          error: "Bad Request", 
          statusCode: 400, 
          message: "Payload should not be empty"
        }).code(400);
      }

      profileModel()
      .findOne({_id:request.params.id})
      .lean()
      .exec(function(err, result) {
        if (err) {
          return reply(err);
        }
        if (!result) {
          return reply({
            error: "Not Found", 
            statusCode: 404, 
            message: "User profile was not found"
          }).code(400);
        }
        User.class.setPassword(result.userId, request.payload.currentPassword, request.payload.password, function(err, result) {
          if (err) {
            return reply(err);
          }
          reply({success : true})
        })
      });
    } else {
      return reply({
        error: "Bad Reqest",
        message: "Failed to update user",
        statusCode: 400
      }).code(400);
    }
  });
}

/**
  * @api {get} /api/user/{id} Get an user
  * @apiName getUser
  * @apiGroups Users
  *
  * @apiParam {String} id Id of an existing user
  *
  * @apiSuccess {Object} result Result object
  * @apiSuccess {String} result.id Id of the user
  * @apiSuccess {String} result.email Email of the user
  * @apiSuccess {String} result.fullName Full name of the user
  *
  * @apiError unauthorized {Object} result Result object
  * @apiError unauthorized {Object} result.statusCode 401
  * @apiError unauthorized {Object} result.error Error code
  * @apiError unauthorized {Object} result.message Description about the error
  *
  * @apiError notFound {Object} result Result object
  * @apiError notFound {Object} result.statusCode 404
  * @apiError notFound {Object} result.error Error code
  * @apiError notFound {Object} result.message Description about the error
  *

**/


Profiles.prototype.get = function(request, reply) {
  var self = this;
  var bogus = self.checkBogus(request.params.id);
  if (bogus.isBogus) {
    return reply(bogus.reply).statusCode = 404;
  }
  profileModel()
    .findOne({_id:request.params.id})
    .exec(function(err, result) {
    if (err) {
      return reply(err).statusCode = 400;
    }
    if (!result) {
      return reply({
        error: "Not Found", 
        statusCode: 404, 
        message: "User profile was not found"
      }).code(400);
    }
    /* var redisClient = request.server.plugins['hapi-redis'].client; */
    /* redisClient.set(request.auth.credentials.profileId, request.headers["socketid"]); */
    reply(result).type("application/json");
  });
}

/**
  * @api {delete} /api/user/{id} Delete existing user
  * @apiName deleteUser
  * @apiGroups Users
  *
  * @apiParam {String} [id] Id of an existing user
  *
  * @apiSuccess {Object} result Result object
  * @apiSuccess {String} result.success Boolean state
  *
  * @apiError unauthorized {Object} result Result object
  * @apiError unauthorized {Object} result.statusCode 401
  * @apiError unauthorized {Object} result.error Error code
  * @apiError unauthorized {Object} result.message Description about the error
  *
  * @apiError notFound {Object} result Result object
  * @apiError notFound {Object} result.statusCode 404
  * @apiError notFound {Object} result.error Error code
  * @apiError notFound {Object} result.message Description about the error

**/

Profiles.prototype.delete = function(request, reply) {
  var self = this;
  var bogus = self.checkBogus(request.params.id);
  if (!request.auth && request.auth.credentials) {
    return reply(boom.unauthorized());
  }
  if (bogus.isBogus) {
    return reply(bogus.reply).statusCode = 404;
  }
  profileModel()
    .findOne({_id:request.params.id})
    .exec(function(err, result) {
    if (err) {
      return reply(err).statusCode = 400;
    }
    if (!result) {
      return reply({
        error: "Not Found", 
        statusCode: 404, 
        message: "User profile was not found"
      }).code(400);
    }
    if (!result.userId) {
      return realDelete(request, reply);
    }
    // Prevent self delete
    if (result.userId.toString() === request.auth.credentials.userId.toString()) {
      return reply({
        error: "Not Found", 
        statusCode: 404, 
        message: "Couldn't self delete."
      }).code(400);
    }
    User.class.remove(result.userId, function(err, result){
      if (err) {
        return reply(err).statusCode = 400;
      }
      realDelete(request, reply);
    })
  })
}

/**
 * @api {post} /api/user/{id}/avatar Uploads a new avatar image
 * @apiName uploadAvatar
 * @apiGroup Users
 *
 * @apiSuccess {Object} result Result
 * @apiSuccess {Boolean} result.success True 
 *
 * @apiError unauthorized {Object} result Result object
 * @apiError unauthorized {Object} result.statusCode 401
 * @apiError unauthorized {Object} result.error Error code
 * @apiError unauthorized {Object} result.message Description about the error
 *
 * @apiError notFound {Object} result Result object
 * @apiError notFound {Object} result.statusCode 404
 * @apiError notFound {Object} result.error Error code
 * @apiError notFound {Object} result.message Description about the error
 * @apiError notFound {Object} result.validation Validation object describing the error 
 * @apiError notFound {String} result.validation.source Source of the error 
 *
 */

Profiles.prototype.uploadAvatar = function(request, reply) {
  var self = this;
  var id = request.params.id;  
  var bogus = self.checkBogus(id);
  if (bogus.isBogus) {
    return reply(bogus.reply).statusCode = 404;
  }
  profileModel()
    .findOne({_id:id})
    .lean().exec(function(err, result) {
    if (err) return reply(err);
    if (result == null) {
      return reply({
        statusCode: 404,
        error: "Not Found", 
        message: "User profile was not found", 
        validation: {
          source: "DB",
          keys: [ "id" ]
        }
      }).statusCode = 404;
    }
    var gfs = Grid(mongoose.connection.db);
    var image = request.payload.avatar;
    var avatarId = mongoose.Types.ObjectId();
    var writeStream = gfs.createWriteStream({
      _id: avatarId, 
      filename: image.hapi.filename,
      root: "profiles",
      metadata: {
        profile: mongoose.Types.ObjectId(id) 
      }
    });
    writeStream.on("finish", function() {
      profileModel().findOneAndUpdate(
        { _id: id}, 
        { 
          avatar: avatarId
        },
        function(err) {
          if (err) return reply(err).statusCode = 500;
          reply({ 
            id: avatarId + "",
            success: true
          }).type("application/json");

        });
    });
    image.pipe(writeStream);
  });
}

/**
 * @api {get} /api/user/{id}/avatar Gets a new avatar image
 * @apiName getAvatar
 * @apiGroup Users
 *
 * @apiSuccess {Buffer} result The image
 *
 * @apiError unauthorized {Object} result Result object
 * @apiError unauthorized {Object} result.statusCode 401
 * @apiError unauthorized {Object} result.error Error code
 * @apiError unauthorized {Object} result.message Description about the error
 *
 * @apiError notFound {Object} result Result object
 * @apiError notFound {Object} result.statusCode 404
 * @apiError notFound {Object} result.error Error code
 * @apiError notFound {Object} result.message Description about the error
 * @apiError notFound {Object} result.validation Validation object describing the error 
 * @apiError notFound {String} result.validation.source Source of the error 
 */
Profiles.prototype.getAvatar = function(request, reply) {
  var self = this;
  var id = request.params.id;
  var bogus = self.checkBogus(id);
  if (bogus.isBogus) {
    return reply(bogus.reply).statusCode = 404;
  }
  profileModel()
    .findOne({_id:id})
    .lean()
    .exec(function(err, result) {
    if (err) return reply(err).statusCode = 500;
    if (result == null || !result.avatar) {
      return reply({}).statusCode = 404;
    }
    var gfs = Grid(mongoose.connection.db);
    gfs.exist({
      _id: result.avatar,
      root: "profiles"
    }, function(err, found) {
      if (err) return reply(err).statusCode = 500;
      if (found == false) {
        // not found
        return reply({
          statusCode: 404,
          error: "Not Found", 
          message: "User profile was not found", 
          validation: {
            source: "DB",
            keys: [ "id" ]
          }
        }).statusCode = 404;
      }
      var rs = gfs.createReadStream({
        _id: result.avatar, 
        root: "profiles",
      });
      reply(rs);
    });

  });
}

/**
 * @api {delete} /api/user/{id}/avatar Removes an avatar image
 * @apiName removeAvatar
 * @apiGroup Users
 *
 * @apiSuccess {Object} result Result
 * @apiSuccess {Boolean} result.success True 
 *
 * @apiError unauthorized {Object} result Result object
 * @apiError unauthorized {Object} result.statusCode 401
 * @apiError unauthorized {Object} result.error Error code
 * @apiError unauthorized {Object} result.message Description about the error
 *
 * @apiError notFound {Object} result Result object
 * @apiError notFound {Object} result.statusCode 404
 * @apiError notFound {Object} result.error Error code
 * @apiError notFound {Object} result.message Description about the error
 * @apiError notFound {Object} result.validation Validation object describing the error 
 * @apiError notFound {String} result.validation.source Source of the error 
 */

Profiles.prototype.removeAvatar = function(request, reply) {
  var self = this;
  var id = request.params.id;
  var bogus = self.checkBogus(id);
  if (bogus.isBogus) {
    return reply(bogus.reply).statusCode = 404;
  }

  profileModel()
    .findOne({_id:id})
    .exec(function(err, dataResult) {
    if (err) return reply(err);
    if (dataResult == null) {
      // the record does not exist, spew 404 immediately
      return reply({
        statusCode: 404,
        error: "Not Found", 
        message: "User profile was not found", 
        validation: {
          source: "DB",
          keys: [ "id" ]
        }
      }).statusCode = 404;
    }
    var imageId = dataResult.avatar;
    var gfs = Grid(mongoose.connection.db);
    gfs.exist({
      _id: imageId, 
      root: "profiles",
    }, function(err, result) {
      if (err) return reply(err).statusCode = 500;
      if (result == false) {
        // not found
        return reply({}).statusCode = 404;
      }

      // First, remove from gridfs
      var rs = gfs.remove({
        _id: imageId, 
        root: "profiles",
      }, function(err) {
        if (err) return reply(err).statusCode = 500;
        avatar = null;
        
        dataResult.save(function(err, result) {
          if (err) return reply(err).statusCode = 500;
          reply({success: true});
        });
      });
    });
  });
}


Profiles.prototype.checkBogus = function(id) {
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


Profiles.prototype.realRegister = function(request, cb) {
  var self = this;
  var newUser = profileModel();
  newUser.fullName = request.payload.fullName;
  newUser.email = request.payload.email;
  newUser.rule = request.payload.rule;
  newUser.userId = request.payload.userId;
  newUser.gender = request.payload.gender;
  newUser.city = request.payload.city;
  newUser.joinedSince = request.payload.joinedSince;
  newUser.birthDate = moment(request.payload.birthDate);
  newUser.activationCode = uuid.v4();
  profileModel().create(newUser, function(err, result) {
    if (err) {
      return cb(parse(err));
    }
    var profile = {
      email : result.email,
      _id : result._id,
      fullName : result.fullName,
      rule : result.rule,
      userId: result.userId
    }
    cb(null, profile);
  })
}

// Privates

var realUpdate = function(request, reply) {
  var self = this;
  var options = {upsert: true};
  profileModel()
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
        message: "User profile was not found"
      }).code(400);
    }
    profileModel()
      .findOne({_id:request.params.id})
      .exec(function(err, result) {
      if (err) {
        return reply(err).statusCode = 400;
      }
      var profile = {
        email : result.email,
        _id : result._id,
        fullName : result.fullName,
        rule : result.rule,
        userId: result.userId
      }
      reply(profile);
    });
  });
}

Profiles.prototype.getUserMap = function(users, cb) {
  var self = this;
  profileModel()
  .find({_id:{$in : users}})
  .lean()
  .exec(function(err, users){
    console.log(users);
    var userMap = {};
    for (var i in users) {
      userMap[users[i]._id] = users[i].fullName;
    }
    cb(userMap);
  })
}

Profiles.prototype.getUserId = function(profileId, cb) {
  var self = this;
  profileModel()
  .findOne({_id : profileId})
  .exec(function(err, result){
    if (err) return cb(err);
    cb(null, result.userId);
  })
}

Profiles.prototype.setHashtag = function(request, reply) {
  var self = this;
  var bogus = self.checkBogus(request.params.id);
  if (bogus.isBogus) {
    return reply(bogus.reply).statusCode = 404;
  }
  profileModel()
    .findOneAndUpdate(
    {_id:request.auth.credentials.profileId}, 
    { $set : { 'hashtag' : request.payload.hashtag } },
    function(err, result) {
    if (err) {
      return reply(err).statusCode = 400;
    }
    if (!result) {
      return reply({
        error: "Not Found", 
        statusCode: 404, 
        message: "User profile was not found"
      }).code(400);
    }
    reply();
  });
}

var realDelete = function(request, reply) {
  var self = this;
  profileModel()
  .remove({_id:request.params.id}, function(err, result) {
    if (err) {
      return reply(err).statusCode = 400;
    }
    reply({success: true}).type("application/json").statusCode = 200;
  });
}

exports.register = function(server, options, next) {
  new Profiles(server, options, next);
  next();
};

exports.register.attributes = {
  pkg: require("./package.json")
};

exports.model = profileModel;

exports.class = Profiles.prototype;
