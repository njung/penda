var Logout = function (AuthService, $state, localStorageService, hawkPairKey, $rootScope){
  this.AuthService = AuthService;
  this.$state = $state;
  this.localStorageService = localStorageService;
  this.hawkPairKey = hawkPairKey;
  this.$rootScope = $rootScope;
  var self = this;
  
  self.localStorageService.remove('hawkPairKey'); // for hawk
  self.localStorageService.remove('token'); // for jwt
  self.localStorageService.remove('currentUser');
  self.hawkPairKey = {};
  self.$rootScope.loginForm = true;
  self.$rootScope.frontPage = true;
  self.$rootScope.currentUser = null;
  self.$rootScope.currentUserRole = null;
  self.$state.go('start');

}

Logout.inject = ['AuthService', '$state', 'localStorageService', 'hawkPairKey', '$rootScope'];

angular.module('logout',[])
.controller('LogoutCtrl', Logout)
;


