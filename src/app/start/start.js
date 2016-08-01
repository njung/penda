var Start = function ($stateParams, $scope, $state, $window, $rootScope, AuthService, localStorageService, toastr, UserService, $timeout, $http, $interval, ToastrService, host, $compile, DatasetService, CategoryService){
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
  this.DatasetService = DatasetService;
  this.CategoryService = CategoryService;
  var self = this;

  /* if (self.$rootScope.currentUser) { */
  /*   self.$state.go('main'); */
  /* } */

  self.$window.scrollTo(0,0)
  console.log(this.$stateParams.action);
  console.log(this.$stateParams.params);
  self.$scope.spinner = false;
  self.$rootScope.loginForm = false;
  self.$rootScope.frontPage = false;
  self.$rootScope.directPage= false;
          
  /* var realCheckToken = function(){ */
  /*   self.AuthService.checkToken({redirect:true}) */
  /*     .then(function(){ */
  /*       self.$state.go('main'); */
  /*       self.$rootScope.loginForm = false; */
  /*       self.UserService.getUserById(self.localStorageService.get('currentUser')) */
  /*         .success(function(data, status, headers) { */
  /*           self.$rootScope.currentUser = data.fullName; */
  /*           self.$rootScope.currentUserRole = data.role; */
  /*         }) */
  /*     }) */
  /* } */
  /* realCheckToken(); */
  
  self.list({limit:5});
  // Load category list
  self.CategoryService.list({limit:0})
  .then(function(result){
    self.$scope.categories = result.data.data;
  })
  .catch(function(result) {
    self.ToastrService.parse(result);
  })
}

Start.prototype.showDataset = function(filename) {
  var self = this;
  self.$state.go('dataset', { mode : filename });
}

Start.prototype.list = function(option){
  var self = this;
  self.$scope.spinner.list = true;
  self.$scope.mode = 'list';
  self.$scope.currentItem = null;
  var option = option || { page : 1 };
  if (!self.$rootScope.currentUser) {
    option.status = 'done';
  }
  self.DatasetService.list(option)
  .then(function(result){
    self.$scope.spinner.list = false;
    self.$scope.list = result.data;
  })
}



Start.inject = [ '$stateParams', '$scope', '$state', '$window', '$rootScope', 'AuthService', 'localStorageService', 'toastr' , 'UserService', '$timeout', '$http', '$interval', 'ToastrService', 'host', '$compile', 'DatasetService', 'CategoryService'];

angular.module('start',[])
.controller('StartCtrl', Start)
;

