var User = function ($stateParams, $scope, $state, $window, $rootScope, AuthService, localStorageService, toastr, $location, ToastrService, $modal, $http, host, AlertService, UserService){
  this.$stateParams = $stateParams;
  this.$scope = $scope;
  this.$state = $state;
  this.$window = $window;
  this.$rootScope = $rootScope;
  this.AuthService = AuthService;
  this.localStorageService = localStorageService
  this.toastr = toastr;
  this.ToastrService = ToastrService;
  this.$location = $location;
  this.$modal = $modal;
  this.$http = $http;
  this.host = host;
  this.AlertService = AlertService;
  this.UserService = UserService;
  
  var self = this;

  self.$window.scrollTo(0,0)

  // Handle main spinners in one place.
  self.$scope.spinner = {
  };

  // TODO this function costs too many request, please think for alternative solution 
  self.AuthService.checkToken({redirect:true})
 
  if (self.$stateParams.mode && self.$stateParams.mode !== 'list') {
    self.get(self.$stateParams.mode);
  } else {
    self.list();
  }
}

User.prototype.showUser = function(data) {
  var self = this;
  self.$rootScope.currentItem = data;
  self.$rootScope.userModal = self.$modal.open({
    templateUrl : 'userModal.html',
    size: 'md',
    controller : 'UserCtrl as user'
  })
  self.$rootScope.userModal.result.then(function(){
  }, function(){
    self.$rootScope.currentItem = null;
    self.list();
  })
}

User.prototype.addUser = function() {
  var self = this;
  self.$rootScope.currentItem = {};
  self.$rootScope.userModal = self.$modal.open({
    templateUrl : 'userModal.html',
    size: 'md',
    controller : 'UserCtrl as user'
  })
  self.$rootScope.userModal.result.then(function(){
  }, function(){
    self.$rootScope.currentItem = null;
    self.list();
  })
}

User.prototype.list = function(option){
  var self = this;
  self.$scope.spinner.list = true;
  self.$scope.mode = 'list';
  var option = option || { page : 1 };
  self.UserService.list(option)
  .then(function(result){
    self.$scope.spinner.list = false;
    self.$scope.list = result.data;
  })
}

User.prototype.get = function(id) {
  var self = this;
  self.$scope.spinner.user = true;
  self.$scope.mode = 'item';
  self.UserService.get(id)
  .then(function(result) {
    self.$rootScope.currentItem = result.data;
    self.$scope.spinner.user = false;
  })
}

User.prototype.paginate = function() {
  var self = this;
  var opt = {
    page : self.$scope.list.page
  }
  self.list(opt);
}

User.prototype.create = function(data) {
  var self = this;
  var data = angular.copy(data);
  self.UserService.create(data)
  .then(function(result) {
    self.$rootScope.userModal.dismiss();
  })
}

User.prototype.delete = function(id) {
  var self = this;
  self.UserService.delete(id)
  .then(function(result) {
    self.list();
  })
}

User.prototype.someFunc = function(params) {
  var self = this;
}

User.inject = [ '$stateParams', '$scope', '$state', '$window', '$rootScope', 'AuthService', 'localStorageService', 'toastr', '$location', 'ToastrService', '$modal', '$http', 'host' , 'AlertService', 'UserService'];

angular.module('user',[])
.controller('UserCtrl', User)
;

