var PassRec = function ($scope, $state, $window, $rootScope, AuthService, localStorageService, toastr, $stateParams, ToastrService){
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
  self.$rootScope.frontPage = false;
  self.$rootScope.directPage= true;

  //should check if the recovery code is still valid
  console.log(self.$stateParams.code);
  self.AuthService.checkRecoveryCode(self.$stateParams.code)
    .success(function(data, status, headers) {
      if (data.success) {
        self.$scope.spinner = false;
      } else {
        self.$scope.spinner = false;
        $state.go("notfound");
      } 
    })
    .error(function(data, status, headers) {
      $state.go("notfound");
    })

}
    
PassRec.prototype.setPasswordRecovery = function(password) {
  var self = this;
  self.$scope.passwordSpinner = true;
  self.AuthService.setPasswordRecovery(self.$stateParams.code, password)
    .success(function(data, status, headers){
        self.$scope.passwordSpinner = false;
        self.$scope.success = true;
    })
    .error(function(data, status, headers){
        self.$scope.isValidCode = false;
        self.$scope.passwordSpinner = false;
        self.ToastrService.parse(data, status);
    })
}
  
PassRec.inject = [ "$scope", "$state", "$window", "$rootScope", "AuthService", "localStorageService", "toastr", "$stateParams", "ToastrService"];

angular.module("passrec",[])
.controller("PassRecCtrl", PassRec)
;

