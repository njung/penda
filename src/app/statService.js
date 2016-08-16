'use strict';
var StatService = function($http, AuthService, host, $rootScope, Upload, localStorageService) {
  this.$http = $http;
  this.host = host;
  this.AuthService = AuthService;
  this.$rootScope = $rootScope;
  this.Upload = Upload;
  this.localStorageService = localStorageService;
  var self = this;
}

StatService.prototype.sum = function() {
  var self = this;
  var path = '/api/stat/sum';
  return self.$http({
    headers : {
      Authorization : self.localStorageService.get('token'),
    },
    method: 'GET',
    url : self.host + path,
  });
}

StatService.inject = ['$http', 'AuthService', 'host', 'Upload', 'localStorageService']

angular.module('statService', [])
.service('StatService', StatService)

