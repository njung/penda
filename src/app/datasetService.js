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
  var req = {
    method: 'POST',
    data : payload,
    url: self.host + '/api/dataset/upload',
    headers : JSON.parse(localStorage.getItem("HawkPairKey"))
  }
  return self.Upload.upload(req);
}

DatasetService.prototype.list = function() {
  var self = this;
  var path = '/api/datasets';
  return self.$http({
    headers : {
      Authorization : self.AuthService.generateMac(path, 'GET'),
    },
    method: 'GET',
    url : self.host + path,
  });
}

DatasetService.inject = ['$http', 'AuthService', 'host', 'Upload']

angular.module('datasetService', [])
.service("DatasetService", DatasetService)

