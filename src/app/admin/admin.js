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
  self.$scope.spinner = {
  };
  self.$scope.limits = [
    {
      text:'10',
      value:10
    },
    {
      text:'20',
      value:20
    },
    {
      text:'50',
      value:50
    },
    {
      text:'99',
      value:99
    },
  ]
  self.$scope.datasetQuery = {
    limit : 10,
    page : 1,
    searchKey : {
    }
  }

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
  self.$scope.spinner.dataset = true;
  self.$scope.mode = 'item';
  self.$scope.viewMode = 'table';
  self.DatasetService.get(filename)
  .then(function(result) {
    self.$scope.currentItem = result.data;
    self.$scope.datasetQuery.total = result.data.totalRows;
    // Collect field
    self.$scope.fields = [{
      text:'SQL',
      value:'sql'
    },{divider:true}]
    if (result.data.tableSchema) {
      var keys = Object.keys(result.data.tableSchema);
      for (var i in keys) {
        self.$scope.fields.push({text:keys[i], value:keys[i]}); 
      }
    }
    self.$scope.spinner.dataset = false;
    self.getQuery();
  })
}

Admin.prototype.nextPageQuery = function() {
  var self = this;
  self.$scope.datasetQuery.page++;
  self.getQuery();
}
Admin.prototype.prevPageQuery = function() {
  var self = this;
  self.$scope.datasetQuery.page--;
  if (self.$scope.datasetQuery.page < 1) {
    self.$scope.datasetQuery.page = 1;
  }
  self.getQuery();
}
Admin.prototype.updateLimit = function(selected) {
  var self = this;
  self.$scope.datasetQuery.limit = selected.value || 10;
  self.getQuery();
}
Admin.prototype.getQuerySearch = function(event) {
  var self = this;
  console.log(event.keyCode);
  if (event.key == 'Enter') {
    self.getQuery();
  }
}
Admin.prototype.getQuery = function() {
  var self = this;
  var $el = $('#view-table');
  $el.text('');
  if (self.$scope.currentItem.status == 'done') {
    self.$scope.spinner.datasetQuery = true;
    // Fetch first page with 10 item limit
    var sql;
    var pagination = ' limit ' + self.$scope.datasetQuery.limit + ' offset ' + (self.$scope.datasetQuery.page - 1)*self.$scope.datasetQuery.limit;

    // Use SQL query string
    if (self.$scope.datasetQuery.searchKey && 
    self.$scope.datasetQuery.searchKey.value == 'sql' && 
    self.$scope.datasetQuery.searchString && 
    self.$scope.datasetQuery.searchString.toLowerCase().indexOf('select') > -1) {
      sql = self.$scope.datasetQuery.searchString;

    // Just search the string
    } else if (self.$scope.datasetQuery.searchKey && 
    self.$scope.datasetQuery.searchKey.value != 'sql' &&
    self.$scope.datasetQuery.searchString) {
      sql = 'select * from ' + self.$scope.currentItem.filename + ' where ' + self.$scope.datasetQuery.searchKey.value + ' like "%' + self.$scope.datasetQuery.searchString + '%"';
      sql += pagination;
    } else {
    
    // Simple pagination
      sql = 'select * from ' + self.$scope.currentItem.filename;
      sql += pagination;
    }
    console.log(sql);
    // replace the table name;
    var splittedSql = sql.split(' ');
    console.log(splittedSql);
    var isFrom = false;
    for (var i in splittedSql) {
      console.log(splittedSql[i]);
      if (isFrom) {
        splittedSql[i] = self.$scope.currentItem.filename;
        break;
      }
      if (splittedSql[i].toLowerCase() == 'from') {
        isFrom = true;
      }
    }
    console.log(splittedSql);
    sql = splittedSql.join(' ');
    console.log(sql);
    var dataset = new recline.Model.Dataset({
      url : '/api/dataset/' + self.$scope.currentItem.filename + '?type=csv&sql=' + sql,
      backend:'csv',
      delimiter: ',',
      encoding : 'utf-8',
    });
    dataset.fetch().done(function(dataset){
      console.log(dataset);
      var grid = new recline.View.SlickGrid({
        model: dataset,
        el: $el
      });
      grid.visible = true;
      grid.render();
      self.$scope.spinner.datasetQuery = false;
      self.$scope.$apply();
    });
  } else {
    $el.text('');
  }
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

