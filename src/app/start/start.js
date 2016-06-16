var Start = function ($stateParams, $scope, $state, $window, $rootScope, AuthService, localStorageService, toastr, UserService, $timeout, $http, $interval, ToastrService, host, $compile){
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
  /*       self.$state.go("main"); */
  /*       self.$rootScope.loginForm = false; */
  /*       self.UserService.getUserById(self.localStorageService.get("currentUser")) */
  /*         .success(function(data, status, headers) { */
  /*           self.$rootScope.currentUser = data.fullName; */
  /*           self.$rootScope.currentUserRule = data.rule; */
  /*         }) */
  /*     }) */
  /* } */
  /* realCheckToken(); */
  
  var dataset = new recline.Model.Dataset({
    url : '/api/sample',
    backend:'csv',
    delimiter: ',',
    encoding : 'utf-8',
  });
  dataset.fetch();
  var $el = $('#mygrid');
  var grid = new recline.View.SlickGrid({
    model: dataset,
    el: $el
  });
  grid.visible = true;
  grid.render();
}


Start.inject = [ "$stateParams", "$scope", "$state", "$window", "$rootScope", "AuthService", "localStorageService", "toastr" , "UserService", "$timeout", "$http", "$interval", "ToastrService", "host", "$compile"];

angular.module("start",[])
.controller("StartCtrl", Start)
;

