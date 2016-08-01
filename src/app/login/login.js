var Login = function ($stateParams, $scope, $state, $window, $rootScope, AuthService, localStorageService, toastr, UserService, $timeout, $http, $interval, ToastrService, host, $compile){
  this.$stateParams = $stateParams;
  this.$scope = $scope;
  this.$state = $state;
  this.$window = $window;
  this.$rootScope = $rootScope;
  this.AuthService = AuthService;
  this.localStorageService = localStorageService
  this.toastr = toastr;
  this.UserService = UserService;
  this.$timeout = $timeout;
  this.$http = $http;
  this.$interval = $interval;
  this.ToastrService = ToastrService;
  this.host = host;
  this.$compile = $compile;
  var self = this;
  self.$window.scrollTo(0,0)
  console.log(this.$stateParams.action);
  console.log(this.$stateParams.params);
  if (this.$stateParams.params == 'activated') {
    this.ToastrService.accountActivated();
  }
  self.$scope.spinner = false;
  self.$rootScope.loginForm = false;
  self.$rootScope.frontPage = false;
  self.$rootScope.directPage= false;

  // initializing
  self.$scope.step = 1;
  self.$scope.transaction = {}

}
    
Login.prototype.login = function(account) {
  var self = this;
  self.$scope.spinner = true;
  self.AuthService.login(account)
  .then(
    // success
    function(data){
      self.$rootScope.currentUser = data.profile.fullName;
      self.$rootScope.currentUserId = data.profile.userId;
      self.$rootScope.currentUserProfileId = data.profile._id;
      self.$rootScope.currentUserRole = data.profile.role;
      self.$scope.spinner = false;
      self.$rootScope.frontPage = false;
      self.$rootScope.loginForm = false;
      self.$rootScope.directPage= false;
      self.$state.go("dataset", {mode:'list'});
    },
    // error
    function(data, status){
      console.log(data, status);
      self.$scope.spinner = false;
      self.ToastrService.parse(data, status);
    }
  )
}

Login.prototype.forgotPassword = function() {
  var self = this;
  self.$window.scrollTo(0,0)
  self.$scope.forgotPassword = true;
  self.$rootScope.frontPage = false;
}

Login.prototype.hideForgotPassword = function() {
  var self = this;
  self.$scope.forgotPasswordSuccess = false;
  self.$scope.forgotPassword = false;
  self.$rootScope.frontPage = true;
}

Login.prototype.sendRecoveryEmail = function(email) {
  var self = this;
  self.$scope.spinner = true;
  self.$scope.recoveryEmail = "";
  console.log("should send recovery email to " + email);
  self.UserService.sendRecoveryEmail(email)
    .success(function(data, status, headers) {
      self.$scope.forgotPasswordSuccess = true; 
      self.$scope.spinner = false;
    })
    .error(function(data, status, headers) {
      console.log(data);
      self.$scope.spinner = false;
      self.ToastrService.parse(data, status);
    })
}

Login.inject = [ "$stateParams", "$scope", "$state", "$window", "$rootScope", "AuthService", "localStorageService", "toastr" , "UserService", "$timeout", "$http", "$interval", "ToastrService", "host", "$compile"];

angular.module("login",[])
.controller("LoginCtrl", Login)
;

