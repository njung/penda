'use strict';
var MenuService = function($rootScope, $state) {
  this.$rootScope = $rootScope;
  this.$state = $state;
  var self = this;
  $rootScope.search = {
    string : ''
  };
}

var MenuController = function($rootScope, MenuService, $scope, AuthService, $state, $modal) {
  this.MenuService = MenuService;
  this.$rootScope = $rootScope;
  this.$scope = $scope;
  this.AuthService = AuthService;
  this.$state = $state;
  this.$modal = $modal;
  var self = this;
}

MenuController.prototype.logout = function(selected) {
  var self = this;
  self.MenuService.expandMenu(selected);
  setTimeout(function() {
    self.AuthService.logout();
  }, 500);
}

MenuController.prototype.changePassword = function(data) {
  var self = this;
  if (self.$rootScope.syncUser) {
    return;
  }
  self.$rootScope.currentItem = data;
  self.$rootScope.changePasswordModal = self.$modal.open({
    templateUrl : 'user/changePassword.html',
    size: 'md',
    controller : 'UserCtrl as user'
  })
}

MenuService.inject = ['$rootScope'];
MenuController.inject = ['$rootScope', 'MenuService', '$scope', 'AuthService', '$modal'];

angular.module('menu', [])
.service('MenuService', MenuService)
.controller('MenuCtrl', MenuController)
;
