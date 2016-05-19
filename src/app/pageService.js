'use strict';
var PageService = function($http, AuthService, host) {
  this.$http = $http;
  this.host = host;
  this.AuthService = AuthService;
  var self = this;
}

PageService.prototype.create = function(transaction) {
  var self = this;
  var path = "/api/pages";
  return self.$http({
    headers : {
      Authorization : self.AuthService.generateMac(path, "POST"),
    },
    method: "POST",
    url : self.host + path,
    data : transaction
  });
}

PageService.prototype.update = function(data) {
  var self = this;
  var path = "/api/page/" + data._id;
  return self.$http({
    headers : {
      Authorization : self.AuthService.generateMac(path, "POST"),
    },
    method: "POST",
    url : self.host + path,
    data : data
  });
}

PageService.prototype.getByUrl = function(url) {
  var self = this;
  var path = "/api/page-by-url/" + url;
  return self.$http({
    headers : {
      Authorization : self.AuthService.generateMac(path, "GET"),
    },
    method: "GET",
    url : self.host + path,
  });
}

PageService.prototype.get = function(id) {
  var self = this;
  var path = "/api/page/" + id;
  return self.$http({
    headers : {
      Authorization : self.AuthService.generateMac(path, "GET"),
    },
    method: "GET",
    url : self.host + path,
  });
}

PageService.prototype.delete = function(data) {
  var self = this;
  var path = "/api/page/" + data._id;
  return self.$http({
    headers : {
      Authorization : self.AuthService.generateMac(path, "DELETE"),
    },
    method: "DELETE",
    url : self.host + path,
  });
}

PageService.prototype.list = function(page, limit) {
  // The first page in API starting from 0
  page--;
  var self = this;
  var path = "/api/pages?page=" + page + "&limit=" + limit;
  return self.$http({
    headers : {
      Authorization : self.AuthService.generateMac(path, "GET"),
    },
    method: "GET",
    url : self.host + path,
  });
}

PageService.inject = ["$http", "AuthService", "host"]

angular.module('pageService', [])
.service("PageService", PageService)

