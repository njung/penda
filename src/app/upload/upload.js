var UploadCtrl = function ($stateParams, $scope, $state, $window, $rootScope, AuthService, localStorageService, toastr, $location, ToastrService, $modal, $http, host, AlertService, DatasetService, Upload, CategoryService){
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
  this.CategoryService = CategoryService;
  
  var self = this;

  self.$window.scrollTo(0,0)

  // Load category list
  self.CategoryService.list({limit:0})
  .then(function(result){
    self.$scope.categories = result.data.data;
  })
  .catch(function(result) {
    self.ToastrService.parse(result);
  })

  // Handle spinners in one place.
  self.spinner = {
  };

  self.AuthService.checkToken({redirect:true})

  self.uploadStatus = "ready";
  self.$scope.data = {
    /* title : 'Data of ' + (new Date()).valueOf(), */
    /* source : 'sample_source', */
    /* contact : 'sample_contact@contact', */
    releaseFreq : 'year',
    year : (new Date()).getFullYear(),
    month : '0',
    /* level : 'sample_level', */
    /* scope : 'sample_scope', */ 
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
    // Transform releaseFreq value
    if (self.$scope.data.releaseFreq === 'year') {
      // 1 jan to 31 dec
      var start = '01/01/' + self.$scope.data.year;
      var end = '12/01/' + self.$scope.data.year;
      console.log(start);
      console.log(end);
      self.$scope.data.dateStart = (new Date(start)).toISOString();
      self.$scope.data.dateEnd = (new Date(end)).toISOString();
      delete(self.$scope.data.month);
    } else if (self.$scope.data.releaseFreq === 'month') {
      var month = (parseInt(self.$scope.data.month) + 1).toString();
      if (month.toString().length == 1) {
        month = '0' + month;
      }
      console.log('selected month : ' + month);
      var start = month + '/01/' + self.$scope.data.year;
      var end = month + '/31/' + self.$scope.data.year;
      console.log(start);
      console.log(end);
      self.$scope.data.dateStart = (new Date(start)).toISOString();
      self.$scope.data.dateEnd = (new Date(end)).toISOString();
    }
    if (!self.$scope.data.dateStart || !self.$scope.data.dateEnd) {
      alert('Please specify the release frequency values');
    }
    self.$rootScope.preventNavigation = true;
    self.uploadStatus = "uploading";
    // Assign uploader ID
    self.$scope.data.uploaderId = self.$rootScope.currentUserProfileId;
    self.DatasetService.upload(file, self.$scope.data)
      .then(function(data, status){
        self.$rootScope.preventNavigation = false;
        self.uploadStatus = "uploaded";
        alert("Berhasil diunggah.");
        self.$scope.data = {};
        self.$state.go('dataset', {mode:'list'});
      }, function(err){
        self.$rootScope.preventNavigation = false;
        self.uploadStatus = "failed";
        // TODO check for error
      }, function(evt){
        self.uploadPercentage = parseInt(100 * evt.loaded / evt.total);
      })
  }
}

UploadCtrl.inject = [ '$stateParams', '$scope', '$state', '$window', '$rootScope', 'AuthService', 'localStorageService', 'toastr' , '$location', 'ToastrService', '$modal', '$http', 'host' , 'AlertService', 'DatasetService', 'Upload', 'CategoryService'];

angular.module('upload',[])
.controller('UploadCtrl', UploadCtrl)
;

