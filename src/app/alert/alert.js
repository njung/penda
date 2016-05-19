var Alert = function ($scope, $state, $window, $rootScope){
  this.$scope = $scope;
  this.$state = $state;
  this.$window = $window;
  this.$rootScope = $rootScope;
  var self = this;
}
    
Alert.inject = [ "$scope", "$state", "$window", "$rootScope"];

angular.module("alert",[])
.controller("AlertCtrl", Alert)
;

