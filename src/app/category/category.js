var Category = function ($stateParams, $scope, $state, $window, $rootScope, AuthService, localStorageService, toastr, $location, ToastrService, $modal, $http, host, AlertService, CategoryService){
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
  this.CategoryService = CategoryService;
  
  var self = this;

  self.$window.scrollTo(0,0)

  // Handle main spinners in one place.
  self.$scope.spinner = {
  };

  // TODO this function costs too many request, please think for alternative solution 
  self.AuthService.checkToken({redirect:true})
 
  if (self.$stateParams.mode && self.$stateParams.mode !== 'list') {
    self.get(self.$stateParams.mode);
  } else {
    self.list();
  }
}

Category.prototype.showCategory = function(data) {
  var self = this;
  self.$rootScope.currentItem = angular.copy(data);
  self.$rootScope.categoryModal = self.$modal.open({
    templateUrl : 'categoryModal.html',
    size: 'md',
    controller : 'CategoryCtrl as category'
  })
  self.$rootScope.categoryModal.result.then(function(){
  }, function(){
    self.$rootScope.currentItem = null;
    self.list();
  })
}

Category.prototype.addCategory = function() {
  var self = this;
  self.$rootScope.currentItem = {};
  self.$rootScope.categoryModal = self.$modal.open({
    templateUrl : 'categoryModal.html',
    size: 'md',
    controller : 'CategoryCtrl as category'
  })
  self.$rootScope.categoryModal.result.then(function(){
  }, function(){
    self.$rootScope.currentItem = null;
    self.list();
  })
}

Category.prototype.list = function(option){
  var self = this;
  self.$scope.spinner.list = true;
  self.$scope.mode = 'list';
  var option = option || { page : 1 };
  // Load all data
  option.limit = 0;
  self.CategoryService.list(option)
  .then(function(result){
    self.$scope.spinner.list = false;
    self.$scope.list = result.data;
  })
  .catch(function(result) {
    self.$scope.spinner.list = false;
    self.ToastrService.parse(result);
  })
}

Category.prototype.get = function(id) {
  var self = this;
  self.$scope.spinner.category = true;
  self.$scope.mode = 'item';
  self.CategoryService.get(id)
  .then(function(result) {
    self.$rootScope.currentItem = result.data;
    self.$scope.spinner.category = false;
  })
  .catch(function(result) {
    self.$scope.spinner.category = false;
    self.ToastrService.parse(result);
  })
}

Category.prototype.paginate = function() {
  var self = this;
  var opt = {
    page : self.$scope.list.page
  }
  self.list(opt);
}

Category.prototype.create = function(data) {
  var self = this;
  var data = angular.copy(data);
  self.CategoryService.create(data)
  .then(function(result) {
    self.$rootScope.categoryModal.dismiss();
  })
  .catch(function(result) {
    self.ToastrService.parse(result);
  })
}

Category.prototype.update = function(data) {
  var self = this;
  var data = angular.copy(data);
  self.CategoryService.update(data)
  .then(function(result) {
    self.$rootScope.categoryModal.dismiss();
  })
  .catch(function(result) {
    self.ToastrService.parse(result);
  })
}


Category.prototype.delete = function(id) {
  var self = this;
  // Prevent self delete
  if (id.toString()===self.$rootScope.currentCategoryProfileId.toString()) {
    return;
  }
  self.CategoryService.delete(id)
  .then(function(result) {
    self.$rootScope.categoryModal.dismiss();
    self.list();
  })
  .catch(function(result) {
    self.ToastrService.parse(result);
  })
}

Category.prototype.someFunc = function(params) {
  var self = this;
}

Category.inject = [ '$stateParams', '$scope', '$state', '$window', '$rootScope', 'AuthService', 'localStorageService', 'toastr', '$location', 'ToastrService', '$modal', '$http', 'host' , 'AlertService', 'CategoryService'];

angular.module('category',[])
.controller('CategoryCtrl', Category)
;

