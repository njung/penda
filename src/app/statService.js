'use strict';
var StatService = function($http, AuthService, host, $rootScope, Upload) {
  this.$http = $http;
  this.host = host;
  this.AuthService = AuthService;
  this.$rootScope = $rootScope;
  this.Upload = Upload;
  var self = this;
}

StatService.prototype.sum = function() {
  var self = this;
  var path = '/api/stat/sum';
  return self.$http({
    headers : {
      Authorization : self.AuthService.generateMac(path, 'GET'),
    },
    method: 'GET',
    url : self.host + path,
  });
}

StatService.inject = ['$http', 'AuthService', 'host', 'Upload']

angular.module('statService', [])
.service("StatService", StatService)

