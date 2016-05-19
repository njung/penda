var NotFound = function ($scope, $state, $window, $rootScope){
  this.$scope = $scope;
  this.$state = $state;
  this.$window = $window;
  this.$rootScope = $rootScope;
  var self = this;

  self.$window.scrollTo(0,0)
  self.$scope.spinner = false;
  self.$rootScope.frontPage = false;
  self.$rootScope.directPage= true;
}
  
NotFound.inject = [ "$scope", "$state", "$window", "$rootScope"];

angular.module("notfound",[])
.controller("NotFoundCtrl", NotFound)
;

