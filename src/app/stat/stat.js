var Stat = function ($stateParams, $scope, $state, $window, $rootScope, AuthService, ToastrService, StatService, $location){
  this.$stateParams = $stateParams;
  this.$scope = $scope;
  this.$state = $state;
  this.$window = $window;
  this.$rootScope = $rootScope;
  this.AuthService = AuthService;
  this.ToastrService = ToastrService;
  this.StatService = StatService;
  this.$location = $location;
  
  var self = this;
  
  // Catch iframe parameter
  if (self.$location.search().iframe === 'true') {
    self.$rootScope.iframe = true;
  }
  if (!self.$rootScope.search) {
    self.$rootScope.search = {}
  }
  
  self.$window.scrollTo(0,0);
  self.render();

}

Stat.prototype.render = function(){
  var self = this;
  self.$scope.labels = ["Download Sales", "In-Store Sales", "Mail-Order Sales"];
  self.$scope.data = [300, 500, 100];

  self.StatService.sum()
  .then(function(result){
    var keys = Object.keys(result.data);
    var label = [];
    var data = [[]];
    for (var i in keys) {
      if (keys[i] && typeof keys[i] == 'string') {
        label.push(keys[i]);
        data[0].push(result.data[keys[i]]);
      }
    }
    self.$scope.sum = {
      label : label,
      data : data
    }
    return self.StatService.complete()
  })
  .then(function(result){
    var label = [];
    var datasets = [];
    var rows = [];
    for (var i in result.data.byCategory) {
      var item = result.data.byCategory[i];
      label.push(item.name);
      datasets.push(item.totalDatasets);
      rows.push(item.totalRows);
    }
    var byCategory = {
      label : label,
      datasets : datasets,
      rows : rows
    }
    label = [];
    datasets = [];
    rows = [];
    for (var i in result.data.byUploader) {
      var item = result.data.byUploader[i];
      label.push(item.name);
      datasets.push(item.totalDatasets);
      rows.push(item.totalRows);
    }
    var byUploader = {
      label : label,
      datasets : datasets,
      rows : rows
    }
    self.$scope.complete = {
      byCategory : byCategory,
      byUploader : byUploader,
    }
  })
  .catch(function(err){
    self.ToastrService.parse(err);
  })
}

Stat.inject = [ '$stateParams', '$scope', '$state', '$window', '$rootScope', 'AuthService', 'ToastrService', 'StatService', '$location'];

angular.module('stat',[])
.controller('StatCtrl', Stat)
;

