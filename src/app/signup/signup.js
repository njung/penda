var Signup = function ($scope, $state, $window, $rootScope, AuthService, localStorageService, toastr, ToastrService){
  this.$scope = $scope;
  this.$state = $state;
  this.$window = $window;
  this.$rootScope = $rootScope;
  this.AuthService = AuthService;
  this.localStorageService = localStorageService
  this.toastr = toastr;
  this.ToastrService = ToastrService;
  var self = this;

  self.$window.scrollTo(0,0)
  self.$scope.spinner = false;
  self.$scope.success = false;
  self.$rootScope.frontPage = false;
  self.$scope.user = {
    birthDate : new Date('01/01/1990'),
  }
  /* self.$rootScope.loginForm = false; */
  /* self.AuthService.checkToken() */
  /*   .then(function(){ */
  /*     self.$state.go("landing"); */
  /*     self.$rootScope.loginForm = false; */
  /*   }) */
}
    
Signup.prototype.register = function(user) {
  var self = this;
  console.log(user);
  if (user.password != user.repeatPassword) {
    return alert('Kata sandi harus sama.');
  }
  // Transform birthDate
  if (user.birthDate.toString().length < 11) {
    user.birthDate = user.birthDate.split('/')[1] + '/' + user.birthDate.split('/')[0] + '/' + user.birthDate.split('/')[2];
  }
  user.birthDate = moment(user.birthDate).format();
  self.$scope.spinner = true;
  self.AuthService.register(user)
  .then(
    // success
    function(data){
      console.log(data);
      self.$scope.spinner = false;
      self.$scope.success = true;
    },
    // error
    function(data, status){
      self.$scope.spinner = false;
      console.log(data);
      self.ToastrService.parse(data, status);
    }
  )
}
  
Signup.inject = [ "$scope", "$state", "$window", "$rootScope", "AuthService", "localStorageService", "toastr", "ToastrService"];

angular.module("signup",[])
.controller("SignupCtrl", Signup)
;

