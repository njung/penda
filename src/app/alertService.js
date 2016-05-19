'use strict';
/*
 * Consider the following example of alertData object
   var alertData = {
    body : 'Are you sure?',
    size : 'sm',
    buttons : [
      { 
        title : 'Cancel',
        func : function(){},
        class : 'btn-default'
      },
      { 
        title : 'OK',
        func : function(){},
        class : 'btn-primary'
      },
    ]
   }
 *
**/
var AlertService = function($http, AuthService, host, $rootScope, $modal) {
  this.$http = $http;
  this.host = host;
  this.AuthService = AuthService;
  this.$rootScope = $rootScope;
  this.$modal = $modal;
  var self = this;
}

AlertService.prototype.fire = function(data) {
  var self = this;
  self.$rootScope.alertData = data; 
  self.$rootScope.alertModal = self.$modal.open({
    templateUrl : 'alertModal.html',
    size: data.size || 'sm',
    controller : 'AlertCtrl'
  })
}

AlertService.inject = ["$http", "AuthService", "host"]

angular.module('alertService', [])
.service("AlertService", AlertService)

