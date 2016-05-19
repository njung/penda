var CropAvatar = function($scope, $rootScope, $modal) {
  this.$scope = $scope;
  this.$rootScope = $rootScope;
  this.$modal = $modal;
  var self = this;
  
  self.$scope.cropped='';

  // Empty controller to handle crop avatar modal

  self.$scope.dismiss = function() {
    self.$rootScope.avatar = self.$scope.cropped;
    self.$rootScope.cropAvatarModal.dismiss();
  }
}

CropAvatar.inject = ['$scope', '$rootScope', '$modal']

angular.module("cropAvatar",[])
.controller("CropAvatarCtrl", CropAvatar)

