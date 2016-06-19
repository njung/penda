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
    title : 'Data of ' + (new Date()).valueOf(),
    source : 'sample_source',
    contact : 'sample_contact@contact',
    releaseFreq : 'year',
    year : 2016,
    level : 'sample_level',
    scope : 'sample_scope', 
  };
  self.$rootScope.preventNavigation = false;


}

UploadCtrl.prototype.upload = function(files, invalid) {
  var self = this;
  if (files && files.length > 0) {
    var file = files[files.length - 1];
    // Check for extension / file type
    var extension = file.name.split('.');
    extension = extension[extension.length-1];
    console.log(extension);
    if (!(extension == 'xlsx' || extension == 'csv')) {
      return alert('Must be a .csv or .xlsx file. Please check the filename extension.');
    }
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

