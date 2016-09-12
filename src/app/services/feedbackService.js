'use strict';
var FeedbackService = function($http, AuthService, host, $rootScope, localStorageService) {
  this.$http = $http;
  this.host = host;
  this.AuthService = AuthService;
  this.$rootScope = $rootScope;
  this.localStorageService = localStorageService;
  var self = this;
}

FeedbackService.prototype.create = function(data) {
  var self = this;
  var path = '/api/feedbacks';
  return self.$http({
    headers : {
      Authorization : self.localStorageService.get('token'),
    },
    method: 'POST',
    url : self.host + path,
    data : data
  });
}

FeedbackService.inject = ['$http', 'AuthService', 'host', 'localStorageService']

angular.module('feedbackService', [])
.service('FeedbackService', FeedbackService)

