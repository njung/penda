var Dataset = function ($stateParams, $scope, $state, $window, $rootScope, AuthService, localStorageService, toastr, $location, ToastrService, $modal, $http, host, AlertService, DatasetService){
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
  self.$scope.appearance = {}
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
  self.$scope.listQuery = {
    uploader : {
      text:'Semua',
      value:'all'
    },
    category : {
      text:'Semua',
      value:'all'
    },
  }
  self.$scope.uploader = [{
      text:'Semua',
      value:'all'
    },{divider:true},
    {
      text:'Provinsi',
      value:'Provinsi'
    },
    {
      text:'Diskes',
      value:'Diskes'
    },
  ]
  self.$scope.categories = [{
      text:'Semua',
      value:'all'
    },{divider:true},
    {
      text:'Pendidikan',
      value:'Pendidikan'
    },
    {
      text:'Kesehatan',
      value:'Kesehatan'
    },
  ]
  self.$scope.datasetQuery = {
    limit : 10,
    page : 1,
    searchKey : {
    }
  }

  // TODO this function costs too many request, please think for alternative solution 
  /* self.AuthService.checkToken({redirect:true}) */
  /*   .then(function(){ */
  /*     /1* self.UserService.getUserById(self.localStorageService.get('currentUser')) *1/ */
  /*     /1*   .success(function(data, status, headers) { *1/ */
  /*     /1*     self.$rootScope.currentUser = data.fullName; *1/ */
  /*     /1*     self.$rootScope.currentUserRule = data.rule; *1/ */
  /*     /1*   }) *1/ */
  /*   }) */
 
  if (self.$stateParams.mode && self.$stateParams.mode !== 'list') {
    self.get(self.$stateParams.mode);
  } else {
    self.list();
  }
}

Dataset.prototype.showDataset = function(filename) {
  var self = this;
  self.$state.go('dataset', { mode : filename });
}

Dataset.prototype.list = function(option){
  var self = this;
  self.$scope.spinner.list = true;
  self.$scope.mode = 'list';
  self.$scope.currentItem = null;
  var option = option || { page : 1 };
  self.DatasetService.list(option)
  .then(function(result){
    self.$scope.spinner.list = false;
    self.$scope.list = result.data;
  })
}

Dataset.prototype.get = function(filename) {
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
      self.$scope.currentItem.schema = [];
      var keys = Object.keys(result.data.tableSchema);
      for (var i in keys) {
        self.$scope.fields.push({text:keys[i], value:keys[i]});
        self.$scope.currentItem.schema.push({
          key : keys[i],
          value : result.data.tableSchema[keys[i]]
        })
      }
    }
    self.$scope.spinner.dataset = false;
    self.getQuery();
  })
}

Dataset.prototype.nextPageQuery = function() {
  var self = this;
  self.$scope.datasetQuery.page++;
  self.getQuery();
}
Dataset.prototype.prevPageQuery = function() {
  var self = this;
  self.$scope.datasetQuery.page--;
  if (self.$scope.datasetQuery.page < 1) {
    self.$scope.datasetQuery.page = 1;
  }
  self.getQuery();
}
Dataset.prototype.updateLimit = function(selected) {
  var self = this;
  self.$scope.datasetQuery.limit = selected.value || 10;
  self.getQuery();
}
Dataset.prototype.getQuerySearch = function(event) {
  var self = this;
  console.log(event.keyCode);
  if (event.key == 'Enter') {
    self.getQuery();
  }
}
Dataset.prototype.getQuery = function() {
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

Dataset.prototype.paginate = function() {
  var self = this;
  var opt = {
    page : self.$scope.list.page
  }
  self.list(opt);
}

Dataset.prototype.alert = function(str) {
  alert(str);
}

Dataset.prototype.delete = function(filename) {
  var self = this;
  self.DatasetService.delete(filename)
  .then(function(result) {
    self.list();
  })
}

Dataset.prototype.someFunc = function(params) {
  var self = this;
}

Dataset.inject = [ '$stateParams', '$scope', '$state', '$window', '$rootScope', 'AuthService', 'localStorageService', 'toastr', '$location', 'ToastrService', '$modal', '$http', 'host' , 'AlertService', 'DatasetService'];

angular.module('dataset',[])
.controller('DatasetCtrl', Dataset)
;

