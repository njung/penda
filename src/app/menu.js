'use strict';
var MenuService = function($rootScope, $state) {
  this.$rootScope = $rootScope;
  this.$state = $state;
  var self = this;
  $rootScope.search = {
    string : ''
  };
}

var MenuController = function($rootScope, MenuService, $scope, AuthService, $state) {
  this.MenuService = MenuService;
  this.$rootScope = $rootScope;
  this.$scope = $scope;
  this.AuthService = AuthService;
  this.$state = $state;
  var self = this;
}

MenuController.prototype.logout = function(selected) {
  var self = this;
  self.MenuService.expandMenu(selected);
  setTimeout(function() {
    self.AuthService.logout();
  }, 500);
}

MenuService.inject = ['$rootScope'];
MenuController.inject = ['$rootScope', 'MenuService', '$scope', 'AuthService'];

angular.module('menu', [])
.service('MenuService', MenuService)
.controller('MenuCtrl', MenuController)
;
