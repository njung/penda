var Admin = function ($stateParams, $scope, $state, $window, $rootScope, AuthService, localStorageService, toastr, $location, ToastrService, $modal, $http, host, AlertService, DatasetService){
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
  this.DatasetService = DatasetService;
  
  var self = this;

  self.$window.scrollTo(0,0)

  // Handle main spinners in one place.
  self.spinner = {
  };

  // TODO this function costs too many request, please think for alternative solution 
  self.AuthService.checkToken({redirect:true})
    .then(function(){
      /* self.UserService.getUserById(self.localStorageService.get('currentUser')) */
      /*   .success(function(data, status, headers) { */
      /*     self.$rootScope.currentUser = data.fullName; */
      /*     self.$rootScope.currentUserRule = data.rule; */
      /*   }) */
    })

  self.list();
}

Admin.prototype.list = function(){
  var self = this;
  self.DatasetService.list()
  .then(function(result){
    self.$scope.list = result.data;
  })
}

Admin.prototype.someFunc = function(params) {
  var self = this;
}

Admin.inject = [ '$stateParams', '$scope', '$state', '$window', '$rootScope', 'AuthService', 'localStorageService', 'toastr', '$location', 'ToastrService', '$modal', '$http', 'host' , 'AlertService', 'DatasetService'];

angular.module('admin',[])
.controller('AdminCtrl', Admin)
;

