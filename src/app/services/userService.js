'use strict';
var UserService = function($http, AuthService, host, localStorageService, $rootScope) {
  this.$http = $http;
  this.host = host;
  this.AuthService = AuthService;
  this.localStorageService = localStorageService;
  this.$rootScope = $rootScope;
  var self = this;
}

UserService.prototype.get = function(id) {
  var self = this;
  var path = '/api/user/' + id;
  return self.$http({
    headers : {
      Authorization : self.localStorageService.get('token'),
    },
    method: 'GET',
    url : self.host + path,
  });
}

UserService.prototype.list = function(option) {
  var self = this;
  var page = option.page || 1;
  var limit;
  if (option.limit === 0) {
    limit = 0;
  } else {
    limit = option.limit || 10;
  }
  var path = '/api/users?page=' + page + '&limit=' + limit;
  return self.$http({
    headers : {
      Authorization : self.localStorageService.get('token'),
    },
    method: 'GET',
    url : self.host + path,
  });
}

UserService.prototype.count = function() {
  var self = this;
  var path = '/api/users/count';
  return self.$http({
    headers : {
      Authorization : self.localStorageService.get('token'),
    },
    method: 'GET',
    url : self.host + path,
  });
}

UserService.prototype.update = function(user) {
  var self = this;
  var data = {
    fullName : user.fullName,
  }
  if (user.password && user.password.length > 0) {
    data.password = user.password;
  }
  var path = '/api/user/' + user._id;
  return self.$http({
    headers : {
      Authorization : self.localStorageService.get('token'),
    },
    method: 'POST',
    url : self.host + path,
    data : data
  });
}

UserService.prototype.create = function(data) {
  var self = this;
  var path = '/api/user-register';
  return self.$http({
    headers : {
      Authorization : self.localStorageService.get('token'),
    },
    method: 'POST',
    url : self.host + path,
    data : data
  });
}

UserService.prototype.changePassword = function(data) {
  var self = this;
  var path = '/api/user/' + self.$rootScope.currentUserProfileId + '/set-password';
  return self.$http({
    headers : {
      Authorization : self.localStorageService.get('token'),
    },
    method : 'POST',
    url : self.host + path,
    data : data,
  });
}

UserService.prototype.delete = function(id) {
  var self = this;
  var path = '/api/user/' + id;
  return self.$http({
    headers : {
      Authorization : self.localStorageService.get('token'),
    },
    method: 'DELETE',
    url : self.host + path,
  });
}

UserService.prototype.setPassword = function(password) {
  var self = this;
  var path = '/api/user/' + self.localStorageService.get('currentUser') + '/set-password';
  return self.$http({
    headers : {
      Authorization : self.localStorageService.get('token')
    },
    method: 'POST',
    url : self.host + path,
    data : {
      currentPassword : password.current,
      password : password.new
    } 
  });
}

UserService.prototype.sendRecoveryEmail = function(email) {
  var self = this;
  var path = '/api/users/password-recovery';
  return self.$http({
    method: 'POST',
    url : self.host + path,
    data : {
      email : email
    } 
  });
}

UserService.prototype.updateProfile = function(profile) {
  var self = this;
  var path = '/api/user/' + self.localStorageService.get('currentUser');
  return self.$http({
    headers : {
      Authorization : self.localStorageService.get('token')
    },
    method: 'POST',
    url : self.host + path,
    data : {
      fullName : profile.fullName,
      birthDate : profile.birthDate,
      city : profile.city,
      originCity : profile.originCity,
      phone : profile.phone,
      description : profile.description,
      facebook : profile.facebook,
      twitter : profile.twitter,
      instagram : profile.instagram,
      blog : profile.blog,
    } 
  });
}

UserService.prototype.setHashtag = function(hashtagString) {
  var self = this;
  var path = '/api/user/' + self.localStorageService.get('currentUser') + '/hashtag';
  return self.$http({
    headers : {
      Authorization : self.localStorageService.get('token')
    },
    method: 'POST',
    url : self.host + path,
    data : {
      hashtag : hashtagString
    } 
  });
}

UserService.inject = ['$http', 'AuthService', 'host', 'localStorageService', '$rootScope']

angular.module('userService', [])
.service('UserService', UserService)

