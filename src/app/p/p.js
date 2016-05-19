var P = function ($scope, $state, $window, $rootScope, AuthService, localStorageService, toastr, $stateParams, PageService, $sce, ErrorService){
  this.$scope = $scope;
  this.$state = $state;
  this.$window = $window;
  this.$rootScope = $rootScope;
  this.AuthService = AuthService;
  this.localStorageService = localStorageService
  this.toastr = toastr;
  this.$stateParams = $stateParams;
  this.PageService = PageService;
  this.$sce = $sce;
  this.ErrorService = ErrorService;
  var self = this;

  self.$scope.spinner = true;
  self.$scope.success = false;
  self.$rootScope.frontPage = false;
  self.$rootScope.directPage= true;
  self.$scope.renderHtml = function (htmlCode) {
    return $sce.trustAsHtml(htmlCode);
  };
  
  self.$window.scrollTo(0,0)
  self.PageService.getByUrl(self.$stateParams.url)
    .success(function(data, status, headers){
      console.log(data);
      self.$scope.page = data;
      self.$scope.spinner = false;
    })
    .error(function(data, status, headers){
      self.$scope.spinner = false;
      self.$state.go("notfound");
      self.ErrorService.parse(data, status);
    })

}
    
P.inject = [ "$scope", "$state", "$window", "$rootScope", "AuthService", "localStorageService", "toastr", "$stateParams", "PageService", "$sce", "ErrorService"];

angular.module("p",[])
.controller("PCtrl", P)
;

