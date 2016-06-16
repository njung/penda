var UploadCtrl = function ($stateParams, $scope, $state, $window, $rootScope, AuthService, localStorageService, toastr, $location, ToastrService, $modal, $http, host, AlertService, DatasetService, Upload){
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
  this.Upload = Upload;
  
  var self = this;

  self.$window.scrollTo(0,0)

  // Handle main spinners in one place.
  self.spinner = {
  };

  self.AuthService.checkToken({redirect:true})

  self.uploadStatus = "ready";
  self.$scope.data = {
    title : (new Date()).valueOf(),
    source : 'source',
    contact : 'contact',
    releaseFreq : 'year',
    level : 'level',
    scope : 'Cakupan', 
  };
  self.$rootScope.preventNavigation = false;


}

UploadCtrl.prototype.upload = function(files, invalid) {
  var self = this;
  if (files && files.length > 0) {
    var file = files[files.length - 1];
    // TODO validate file type
    self.$rootScope.preventNavigation = true;
    self.uploadStatus = "uploading";
    self.DatasetService.upload(file, self.$scope.data)
      .then(function(data, status){
        self.$rootScope.preventNavigation = false;
        self.uploadStatus = "uploaded";
        alert("Berhasil diunggah.");
        self.$scope.data = {};
        self.$state.go('admin');
      }, function(err){
        self.$rootScope.preventNavigation = false;
        self.uploadStatus = "failed";
        // TODO check for error
      }, function(evt){
        self.uploadPercentage = parseInt(100 * evt.loaded / evt.total);
      })
  }
}

UploadCtrl.inject = [ '$stateParams', '$scope', '$state', '$window', '$rootScope', 'AuthService', 'localStorageService', 'toastr' , '$location', 'ToastrService', '$modal', '$http', 'host' , 'AlertService', 'DatasetService', 'Upload'];

angular.module('upload',[])
.controller('UploadCtrl', UploadCtrl)
;

