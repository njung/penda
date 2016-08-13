var Start = function ($stateParams, $scope, $state, $window, $rootScope, AuthService, localStorageService, toastr, UserService, $timeout, $http, $interval, ToastrService, host, $compile, DatasetService, CategoryService, StatService, $http, host){
  this.$stateParams = $stateParams;
  this.$scope = $scope;
  this.$state = $state;
  this.$window = $window;
  this.$rootScope = $rootScope;
  this.AuthService = AuthService;
  this.localStorageService = localStorageService
  this.toastr = toastr;
  this.UserService = UserService;
  this.$timeout = $timeout;
  this.$http = $http;
  this.$interval = $interval;
  this.ToastrService = ToastrService;
  this.host = host;
  this.$compile = $compile;
  this.DatasetService = DatasetService;
  this.CategoryService = CategoryService;
  this.StatService = StatService;
  this.host = host;
  this.$http = $http;
  var self = this;

  self.$window.scrollTo(0,0)
  console.log(this.$stateParams.action);
  console.log(this.$stateParams.params);
  self.$scope.spinner = false;
  self.$rootScope.loginForm = false;
  self.$rootScope.frontPage = false;
  self.$rootScope.directPage= false;
          
  self.list({limit:5});
  // Load category list
  self.CategoryService.list({limit:0})
  .then(function(result){
    self.$scope.categories = result.data.data;
  })
  .catch(function(result) {
    self.ToastrService.parse(result);
  })

  // Load RSS
  var rss = '_RSS_URL_';
  console.log(rss);
  self.$scope.spinner.rss = true;
  if (rss.indexOf('http') > -1) {
    self.$http({method:"GET", url : self.host + '/api/rss?url=' + rss })
    .then(function(result){
      self.$scope.spinner.rss = false;
      self.$scope.rssData = result.data;
    })
    .catch(function(result) {
      self.$scope.spinner.rss = false;
    })
  }

  // Load stat
  self.StatService.sum()
  .then(function(result) {
    // Make it global so it will be accessible by CountUp library
    var recordOptions = {
      useEasing : true, 
      useGrouping : true, 
      separator : ',', 
      decimal : '.', 
      suffix : ' record' 
    };
    var recordCounterUp = new CountUp("recordCounterUp", 0, result.data.row, 0, 10, recordOptions);
    recordCounterUp.start();

    var datasetOptions = {
      useEasing : true, 
      useGrouping : true, 
      separator : ',', 
      decimal : '.', 
      suffix : ' dataset' 
    };
    var datasetCounterUp = new CountUp("datasetCounterUp", 0, result.data.dataset, 0, 5, datasetOptions);
    datasetCounterUp.start();
    
    var organizationOptions = {
      useEasing : true, 
      useGrouping : true, 
      separator : ',', 
      decimal : '.', 
      suffix : ' dinas/instansi' 
    };
    var organizationCounterUp = new CountUp("organizationCounterUp", 0, result.data.org, 0, 5, organizationOptions);
    organizationCounterUp.start();

    var categoryOptions = {
      useEasing : true, 
      useGrouping : true, 
      separator : ',', 
      decimal : '.', 
      suffix : ' kategori' 
    };
    var categoryCounterUp = new CountUp("categoryCounterUp", 0, result.data.category, 0, 5, categoryOptions);
    categoryCounterUp.start();
  })
  .catch(function(result) {
    self.ToastrService.parse(result);
  })
}

Start.prototype.showDataset = function(filename) {
  var self = this;
  self.$state.go('dataset', { mode : filename });
}

Start.prototype.list = function(option){
  var self = this;
  self.$scope.spinner.list = true;
  self.$scope.mode = 'list';
  self.$scope.currentItem = null;
  var option = option || { page : 1 };
  if (!self.$rootScope.currentUser) {
    option.status = 'done';
  }
  self.DatasetService.list(option)
  .then(function(result){
    self.$scope.spinner.list = false;
    self.$scope.list = result.data;
  })
}

Start.inject = [ '$stateParams', '$scope', '$state', '$window', '$rootScope', 'AuthService', 'localStorageService', 'toastr' , 'UserService', '$timeout', '$http', '$interval', 'ToastrService', 'host', '$compile', 'DatasetService', 'CategoryService', 'StatService', 'host'];

angular.module('start',[])
.controller('StartCtrl', Start)
;

