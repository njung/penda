'use strict';
var AuthService = function($http, localStorageService, hawkPairKey, host, $rootScope, $state, $q, $window) {
  this.$http = $http;
  this.localStorageService = localStorageService;
  this.hawkPairKey = hawkPairKey;
  this.host = host;
  this.$rootScope = $rootScope;
  this.$state = $state;
  this.$q = $q;
  this.$window = $window;
  var self = this;
  
}
  
AuthService.prototype.login = function(account) {
  var self = this;
  var deferred = self.$q.defer();
  
  var path = "/api/users/login";
  self.$http({
    method: "POST",
    url : self.host + path,
    data : account,
  })
  .success(function(data, status, headers, config) {
    self.localStorageService.set("hawkPairKey", headers("token"));
    self.localStorageService.set("currentUser", headers("current_user"));
    self.localStorageService.set("currentUserProfileId", headers("current_user"));
    self.localStorageService.set("currentUserCountry", headers("country"));
    self.hawkPairKey = {
      id : self.localStorageService.get("hawkPairKey").split(" ")[0],
      key : self.localStorageService.get("hawkPairKey").split(" ")[1],
      algorithm : "sha256"
    }
    deferred.resolve(data);
  })
  .error(function(data, status, headers) {
    deferred.reject(data, status);
  });
  return deferred.promise;
}
AuthService.prototype.register = function(newUser) {
  var self = this;
  var deferred = self.$q.defer();
  
  var path = "/api/user-register";
  self.$http({
    method: "POST",
    url : self.host + path,
    data : newUser,
  })
  .success(function(data, status, headers, config) {
    console.log(data);
    deferred.resolve(data);
  })
  .error(function(data, status, headers) {
    console.log(data);
    deferred.reject(data, status);
  });
  return deferred.promise;
}

AuthService.prototype.confirm = function(code) {
  var self = this;
  var path = "/api/users/confirm/" + code;
  return self.$http({
    method: "GET",
    url : self.host + path,
  });
}

AuthService.prototype.generateMac = function(path, method) {
  var self = this;
  return hawk.client.header(self.host + path, method, {credentials : self.hawkPairKey }).field;
}

AuthService.prototype.logout = function() {
  var self = this;
  var path = "/api/users/logout";
  self.$http({
    headers : {
      Authorization : self.generateMac(path, "GET")
    },
    method: "GET",
    url : self.host + path,
  })
  .success(function(data, status, headers, config) {
    self.clearCredentials();
    /* self.$window.location.reload() */
  })
  .error(function(data, status, headers) {
    self.clearCredentials();
  });
}

AuthService.prototype.clearCredentials = function(){
  var self = this;
  self.localStorageService.remove("hawkPairKey");
  self.localStorageService.remove("currentUser");
  self.hawkPairKey = {};
  self.$rootScope.loginForm = true;
  self.$rootScope.frontPage = true;
  self.$rootScope.currentUser = false;
  self.$rootScope.currentUserRule = false;
  self.$state.go("start");
}


AuthService.prototype.checkToken = function(options) {
  var self = this;
  var deferred = self.$q.defer();
  // Check if existing token is still valid
  if (self.localStorageService.get("hawkPairKey") != null
    || self.localStorageService.get("currentUser") != null
    || self.localStorageService.get("currentUser")) {
    self.hawkPairKey = {
      id : self.localStorageService.get("hawkPairKey").split(" ")[0],
      key : self.localStorageService.get("hawkPairKey").split(" ")[1],
      algorithm : "sha256"
    }
    var path = "/api/user/" + self.localStorageService.get("currentUser");
    self.$http({
      headers : {
        Authorization : self.generateMac(path, "GET")
      },
      method: "GET",
      url : self.host + path,
    })
    .success(function(data, status, headers, config) {
      console.log("Token is valid");
      console.log(data);
      if (data.statusCode == 401) {
        if (options.redirect == true) return self.clearCredentials();
      }
      self.$rootScope.currentUser = data.fullName;
      self.$rootScope.currentUserProfileId = self.localStorageService.get("currentUser");
      self.$rootScope.currentUserRule = data.rule;
      deferred.resolve();
    })
    .error(function(data, status, headers) {
      console.log("Token is invalid");
      if (options.redirect == true) self.clearCredentials();
    });
  } else {
    if (options.redirect == true) self.clearCredentials();
  }
  return deferred.promise;
}

AuthService.prototype.checkRecoveryCode = function(code) {
  var self = this;
  var path = "/api/users/check-recovery-code/" + code;
  return self.$http({
    method: "GET",
    url : self.host + path,
  });
}

AuthService.prototype.setPasswordRecovery = function(code, password) {
  var self = this;
  var path = "/api/users/set-password-recovery/" + code;
  return self.$http({
    method: "POST",
    url : self.host + path,
    data : { password : password } // contains recovery code and the new password
  });
}

AuthService.inject = ["$http", "localStorageService", "hawkPairKey", "host", "$rootScope", "$state", "$q", "$window"];

angular.module('authService', [])
.constant("host", "_API_")
.value("hawkPairKey", {
  algorithm : "sha256"
})
.service("AuthService", AuthService)

