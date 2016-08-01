'use strict';
var CategoryService = function($http, AuthService, host, localStorageService) {
  this.$http = $http;
  this.host = host;
  this.AuthService = AuthService;
  this.localStorageService = localStorageService;
  var self = this;
}

CategoryService.prototype.get = function(id) {
  var self = this;
  var path = '/api/category/' + id;
  return self.$http({
    headers : {
      Authorization : self.AuthService.generateMac(path, 'GET'),
    },
    method: 'GET',
    url : self.host + path,
  });
}

CategoryService.prototype.list = function(option) {
  var self = this;
  var page = option.page || 1;
  var limit = option.limit || 10;
  var path = '/api/categories?page=' + page + '&limit=' + limit;
  return self.$http({
    headers : {
      Authorization : self.AuthService.generateMac(path, 'GET'),
    },
    method: 'GET',
    url : self.host + path,
  });
}

CategoryService.prototype.update = function(data) {
  var self = this;
  var path = '/api/category/' + data._id;
  return self.$http({
    headers : {
      Authorization : self.AuthService.generateMac(path, 'POST'),
    },
    method: 'POST',
    url : self.host + path,
    data : data
  });
}

CategoryService.prototype.create = function(data) {
  var self = this;
  var path = '/api/categories';
  return self.$http({
    headers : {
      Authorization : self.AuthService.generateMac(path, 'POST'),
    },
    method: 'POST',
    url : self.host + path,
    data : data
  });
}

CategoryService.prototype.delete = function(id) {
  var self = this;
  var path = '/api/category/' + id;
  return self.$http({
    headers : {
      Authorization : self.AuthService.generateMac(path, 'DELETE'),
    },
    method: 'DELETE',
    url : self.host + path,
  });
}

CategoryService.inject = ['$http', 'AuthService', 'host', 'localStorageService']

angular.module('categoryService', [])
.service('CategoryService', CategoryService)

