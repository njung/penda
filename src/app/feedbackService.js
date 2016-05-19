'use strict';
var FeedbackService = function($http, AuthService, host, $rootScope) {
  this.$http = $http;
  this.host = host;
  this.AuthService = AuthService;
  this.$rootScope = $rootScope;
  var self = this;
}

FeedbackService.prototype.create = function(data) {
  var self = this;
  var path = "/api/feedbacks";
  return self.$http({
    headers : {
      Authorization : self.AuthService.generateMac(path, "POST"),
    },
    method: "POST",
    url : self.host + path,
    data : data
  });
}

FeedbackService.inject = ["$http", "AuthService", "host"]

angular.module('feedbackService', [])
.service("FeedbackService", FeedbackService)

