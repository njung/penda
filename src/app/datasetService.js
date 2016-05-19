'use strict';
var DatasetService = function($http, AuthService, host, $rootScope, Upload) {
  this.$http = $http;
  this.host = host;
  this.AuthService = AuthService;
  this.$rootScope = $rootScope;
  this.Upload = Upload;
  var self = this;
}

DatasetService.prototype.upload = function(data, opts) {
  var self = this;
  var payload = {
    content : data,
  }
  if (opts) {
    payload.opts = opts;
  }
  var req = {
    method: 'POST',
    data : payload,
    url: self.host + '/api/dataset/upload',
    headers : JSON.parse(localStorage.getItem("HawkPairKey"))
  }
  return self.Upload.upload(req);
}

DatasetService.inject = ['$http', 'AuthService', 'host', 'Upload']

angular.module('datasetService', [])
.service("DatasetService", DatasetService)

