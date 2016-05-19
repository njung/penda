var Confirm = function ($scope, $state, $window, $rootScope, AuthService, localStorageService, toastr, $stateParams, ToastrService){
  this.$scope = $scope;
  this.$state = $state;
  this.$window = $window;
  this.$rootScope = $rootScope;
  this.AuthService = AuthService;
  this.localStorageService = localStorageService
  this.toastr = toastr;
  this.$stateParams = $stateParams;
  this.ToastrService = ToastrService;
  var self = this;

  self.$scope.spinner = true;
  self.$scope.success = false;
  self.$rootScope.frontPage = false;
  self.$rootScope.directPage= true;
  console.log("registration confirmation");
  
  self.AuthService.confirm(self.$stateParams.code)
    .success(function(data, status, headers){
      console.log(data);
      self.$scope.spinner = false;
      self.$scope.success = true;
      self.$state.go("login", {params : 'activated'});
    })
    .error(function(data, status, headers){
      console.log(data);
      self.$scope.spinner = false;
      self.$state.go("notfound");
      self.ToastrService.parse(data, status);
    })
}
    
Confirm.inject = [ "$scope", "$state", "$window", "$rootScope", "AuthService", "localStorageService", "toastr", "$stateParams", "ToastrService"];

angular.module("confirm",[])
.controller("ConfirmCtrl", Confirm)
;

