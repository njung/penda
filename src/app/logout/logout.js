var Logout = function (AuthService, $state, localStorageService, $rootScope){
  this.AuthService = AuthService;
  this.$state = $state;
  this.localStorageService = localStorageService;
  this.$rootScope = $rootScope;
  var self = this;
  
  self.localStorageService.remove('token'); // for jwt
  self.localStorageService.remove('currentUser');
  self.$rootScope.loginForm = true;
  self.$rootScope.frontPage = true;
  self.$rootScope.currentUser = null;
  self.$rootScope.currentUserRole = null;
  self.$state.go('start');

}

Logout.inject = ['AuthService', '$state', 'localStorageService', '$rootScope'];

angular.module('logout',[])
.controller('LogoutCtrl', Logout)
;


