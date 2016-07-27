'use strict';
var DatasetService = function($http, AuthService, host, $rootScope, Upload) {
  this.$http = $http;
  this.host = host;
  this.AuthService = AuthService;
  this.$rootScope = $rootScope;
  this.Upload = Upload;
  var self = this;
}

DatasetService.prototype.upload = function(data, obj) {
  var self = this;
  var payload = {}
  var keys = Object.keys(obj);
  for (var i in keys) {
    payload[keys[i]] = obj[keys[i]];
  }
  console.log(payload);
  payload.content = data; 
  var path = self.host + '/api/upload';
  var headers;
  if (self.authStrategy == 'hawk') {
    headers = JSON.parse(localStorage.getItem("HawkPairKey"));
  } else {
    headers = {
      Authorization : self.AuthService.generateMac(path, 'GET')
    }
  }
  var req = {
    method: 'POST',
    data : payload,
    timeout : 300000,
    url: path,
    headers : headers
  }
  return self.Upload.upload(req);
}

DatasetService.prototype.list = function(option) {
  var self = this;
  var page = option.page || 1;
  var limit = option.limit || 10;
  var path = '/api/datasets';
  path += '?page=' + page;
  path += '&limit=' + limit;
  if (option.status) {
    path += '&status=' + option.status;
  }
  return self.$http({
    headers : {
      Authorization : self.AuthService.generateMac(path, 'GET'),
    },
    method: 'GET',
    url : self.host + path,
  });
}

DatasetService.prototype.get = function(filename, option) {
  var self = this;
  option = option || {};
  var path = '/api/dataset/' + filename;
  if (option.sql) {
    path += '?sql=' + option.sql;
  }
  return self.$http({
    headers : {
      Authorization : self.AuthService.generateMac(path, 'GET'),
    },
    method: 'GET',
    url : self.host + path,
  });
}

DatasetService.prototype.delete = function(filename) {
  var self = this;
  var path = '/api/dataset/' + filename;
  return self.$http({
    headers : {
      Authorization : self.AuthService.generateMac(path, 'DELETE'),
    },
    method: 'DELETE',
    url : self.host + path,
  });
}


DatasetService.inject = ['$http', 'AuthService', 'host', 'Upload']

angular.module('datasetService', [])
.service("DatasetService", DatasetService)

