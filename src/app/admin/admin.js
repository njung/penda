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

Admin.prototype.list = function(option){
  var self = this;
  self.$scope.mode = 'list';
  self.$scope.currentItem = null;
  var option = option || { page : 1 };
  self.DatasetService.list(option)
  .then(function(result){
    self.$scope.list = result.data;

  })
}

Admin.prototype.get = function(filename) {
  var self = this;
  self.$scope.mode = 'item';
  self.DatasetService.get(filename)
  .then(function(result) {
    self.$scope.currentItem = result.data;
    var $el = $('#view-table');
    if (self.$scope.currentItem.status == 'done') {
      // Fetch first page with 10 item limit
      var dataset = new recline.Model.Dataset({
        url : '/api/dataset/' + filename + '?type=csv&sql=select * from ' + filename + ' limit 10 offset 0',
        backend:'csv',
        delimiter: ',',
        encoding : 'utf-8',
      });
      dataset.fetch();
      var grid = new recline.View.SlickGrid({
        model: dataset,
        el: $el
      });
      grid.visible = true;
      grid.render();
    } else {
      $el.text('');
    }
  })
}

Admin.prototype.paginate = function() {
  var self = this;
  var opt = {
    page : self.$scope.list.page
  }
  self.list(opt);
}

Admin.prototype.alert = function(str) {
  alert(str);
}

Admin.prototype.delete = function(filename) {
  var self = this;
  self.DatasetService.delete(filename)
  .then(function(result) {
    self.list();
  })
}

Admin.prototype.someFunc = function(params) {
  var self = this;
}

Admin.inject = [ '$stateParams', '$scope', '$state', '$window', '$rootScope', 'AuthService', 'localStorageService', 'toastr', '$location', 'ToastrService', '$modal', '$http', 'host' , 'AlertService', 'DatasetService'];

angular.module('admin',[])
.controller('AdminCtrl', Admin)
;

