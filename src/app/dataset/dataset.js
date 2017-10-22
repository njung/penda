var Dataset = function ($stateParams, $scope, $state, $window, $rootScope, AuthService, localStorageService, toastr, $location, ToastrService, $modal, $http, host, DatasetService, $compile, CategoryService, UserService, $http, host){
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
  this.DatasetService = DatasetService;
  this.$compile = $compile;
  this.CategoryService = CategoryService;
  this.UserService = UserService;
  this.$http = $http;
  this.host = host;
  
  var self = this;
  
  // Catch iframe parameter
  if (self.$location.search().iframe === 'true') {
    self.$rootScope.iframe = true;
  }
  if (!self.$rootScope.search) {
    self.$rootScope.search = {}
  }
  
  // Check for external credential
  if (self.$location.search().credential && self.$location.search().credential.length > 0) {
    var b64str = self.$location.search().credential;
    var credential = JSON.parse(atob(b64str));
    self.localStorageService.set('currentUser', credential.username);
    self.localStorageService.set('token', credential.token);
  }

  self.$window.scrollTo(0,0);

  // Datepicker init
  self.$scope.showDateStartPicker = false;
  self.$scope.months = new Array();
  self.$scope.months[0] = "Januari";
  self.$scope.months[1] = "Februari";
  self.$scope.months[2] = "Maret";
  self.$scope.months[3] = "April";
  self.$scope.months[4] = "Mei";
  self.$scope.months[5] = "Juni";
  self.$scope.months[6] = "Juli";
  self.$scope.months[7] = "Agustus";
  self.$scope.months[8] = "September";
  self.$scope.months[9] = "Oktober";
  self.$scope.months[10] = "November";
  self.$scope.months[11] = "Desember";
  // Handle main spinners in one place.
  self.$scope.spinner = {
  };
  // For the map
  self.$scope.center = {}
  self.$scope.viewMode = 'table';
  self.$scope.mapAvailable = false;
  self.$scope.appearance = {}
  self.$scope.notFound = false;
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
  self.$scope.uploaderSelection = [{
      text:'Semua',
      value:'all'
    },{divider:true}
  ]
  self.$scope.categorySelection = [{
      text:'Semua',
      value:'all'
    },{divider:true}
  ]
  self.$scope.datasetQuery = {
    limit : 10,
    page : 1,
    searchKey : {
    }
  }

  if (self.$stateParams.mode && self.$stateParams.mode !== 'list') {
    self.$rootScope.search.string = null;
    self.$rootScope.search.lastString = null;
    self.get(self.$stateParams.mode);
  } else {
    self.list();
  }
  
  self.CategoryService.list({limit:0})
  .then(function(result){
    self.$scope.categories = result.data.data;
    for (var i in self.$scope.categories) {
      self.$scope.categories[i];
      self.$scope.categorySelection.push({
        text : self.$scope.categories[i].name,
        value : self.$scope.categories[i].name
      })
    }
    return self.UserService.list({limit:0})
  })
  .then(function(result){
    self.$scope.users = result.data.data;
    for (var i in self.$scope.users) {
      self.$scope.users[i];
      self.$scope.uploaderSelection.push({
        text : self.$scope.users[i].fullName,
        value : self.$scope.users[i].fullName
      })
    }
    self.$scope.listQueryWatch = false;
    setTimeout(function(){
      self.$scope.listQueryWatch = true;
    }, 1000)
    self.$scope.$watch('listQuery.uploader', function(val){
      if (self.$scope.mode == 'list' && self.$scope.listQueryWatch) {
        var opt = { limit : 0, operator : 'and' }
        self.list(opt);
      }
    })
    self.$scope.$watch('listQuery.category', function(val){
      if (self.$scope.mode == 'list' && self.$scope.listQueryWatch) {
        var opt = { limit : 0, operator : 'and' }
        self.list(opt);
      }
    })
  })
  .catch(function(result) {
    self.ToastrService.parse(result);
  })
  
  // Load RSS
  var rss = '_RSS_URL_';
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
}

Dataset.prototype.showDataset = function(filename) {
  var self = this;
  self.$rootScope.goTo('dataset', filename);
}

Dataset.prototype.list = function(option){
  var self = this;
  self.$scope.spinner.list = true;
  self.$scope.mode = 'list';
  self.$scope.currentItem = null;
  var option = option || { page : 1 };
  if (!self.$rootScope.currentUser) {
    option.status = 'done';
  }
  if (self.$rootScope.search && self.$rootScope.search.string) {
    option.title = self.$rootScope.search.string;
    option.description = self.$rootScope.search.string;
    option.category = self.$rootScope.search.string;
    option.uploader = self.$rootScope.search.string;
  }
  if (self.$scope.listQuery.category.value !== 'all') {
    option.category = self.$scope.listQuery.category.value;
  }
  if (self.$scope.listQuery.uploader.value !== 'all') {
    option.uploader = self.$scope.listQuery.uploader.value;
  }
  self.DatasetService.list(option)
  .then(function(result){
    self.$scope.spinner.list = false;
    self.$scope.list = result.data;
  })
  .catch(function(result) {
    self.ToastrService.parse(result);
  })
}

Dataset.prototype.loadGraph = function() {
  var self = this;
  self.$scope.viewMode = 'graph';
	self.getQuery();
}

Dataset.prototype.get = function(filename) {
  var self = this;
  self.$scope.notFound = false;
  self.$scope.spinner.dataset = true;
  self.$scope.mode = 'item';
  self.DatasetService.get(filename)
  .then(function(result) {
    self.$scope.currentItem = result.data;
    self.$scope.numberFieldAvailable = false;
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
        if (keys[i] && result.data.tableSchema[keys[i]] && result.data.tableSchema[keys[i]] != undefined) {
          self.$scope.currentItem.schema.push({
            key : keys[i],
            value : result.data.tableSchema[keys[i]]
          })
          if (result.data.tableSchema[keys[i]] === 'number') {
            self.$scope.currentItem.numberFieldAvailable = true;
          }
        }
      }
    }
    self.$scope.spinner.dataset = false;
    self.$scope.$apply();
    self.getQuery();
  })
  .catch(function(result) {
    self.$scope.spinner.dataset = false;
    if (result.status === 404) {
      self.$scope.notFound = true;
    }
    self.ToastrService.parse(result);
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
      sql = splittedSql.join(' ');
      console.log(sql);
      sql = window.btoa(sql);
      var dataset = new recline.Model.Dataset({
        url : '/api/dataset/' + self.$scope.currentItem.filename + '?type=csv&sql=' + sql,
        backend:'csv',
        delimiter: ',',
        encoding : 'utf-8',
      });
      dataset.fetch().done(function(dataset){
        if (self.$scope.viewMode === 'table') {
          var $el = $('#view-table');
          var grid = new recline.View.SlickGrid({
            model: dataset,
            el: $el
          });
          grid.visible = true;
          grid.render();
          self.$scope.spinner.datasetQuery = false;
          self.$scope.$apply();
        } else if (self.$scope.viewMode === 'graph') {
          // Collect selected field
          self.$scope.series = [];
          for (var i in self.$scope.currentItem.schema) {
            if (self.$scope.currentItem.schema[i].picked) {
              self.$scope.series.push(self.$scope.currentItem.schema[i].key);
              if (self.$scope.currentItem.schema[i].value === 'number') {
                self.$scope.currentItem.numberFieldAvailable = true;
              }
            }
          }
          if (self.$scope.series.length < 1 || !self.$scope.graphGroupBy) {
            self.$scope.spinner.datasetQuery = false;
            return;
	  }
          var $el = $('#view-graph');
          $el.text('');
          var opt = {
            model: dataset,
            state: {
              graphType: "lines-and-points",
              group: self.$scope.graphGroupBy,
              series: self.$scope.series
            }
          }
          var graph = new recline.View.Graph(opt);
          $el.append(graph.el);
          graph.render();
          graph.redraw();
          self.$scope.spinner.datasetQuery = false;
          self.$scope.$apply();
        } else if (self.$scope.viewMode === 'map') {
          self.$scope.spinner.datasetQuery = false;
          // Map field ( long, lang ) should be available on the schema.
          var longExists, latExists;
          for (var i in self.$scope.currentItem.schema) {
            if (self.$scope.currentItem.schema[i].key === 'long') {
              longExists = true;
            }
            if (self.$scope.currentItem.schema[i].key === 'lat') {
              latExists = true;
            }
          }
          if (longExists && latExists) {
            self.$scope.mapAvailable = true;
            // Collect markers
            var markers = {};
            var records = dataset.records.toJSON();
            for (var i in records) {
              var marker = {
                lat : records[i].lat,
                lng : records[i].long,
              };
              markers['m' + i] = marker;
            }
            angular.extend(self.$scope, {
              center : {
                lat : -2.5,
                lng : 117.5,
                zoom : 5
              },
              position : {
                lat : -2.5,
                lng : 117.5,
                zoom : 5
              },
              defaults : {
                scrollWheelZoom : false,
              },
              markers : markers
            });
            var mapTemplate = '<leaflet lf-center="center" defaults="defaults" markers="markers" height="480px"></leaflet>';
            var content = self.$compile(mapTemplate)(self.$scope);
            var $el = $('#view-map');
            $el.text('');
            $el.append(content);
          }
          self.$scope.$apply();
        }
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
  .catch(function(result) {
    self.ToastrService.parse(result);
  })
}

Dataset.prototype.showEditForm = function(data) {
  var self = this;
  self.$scope.data = angular.copy(data);
  self.$scope.mode = 'edit';
  self.CategoryService.list({limit:0})
  .then(function(result){
    self.$scope.categories = result.data.data;
    if (self.$scope.data.category) {
      for (var i in self.$scope.categories) {
        for (var j in self.$scope.data.category) {
          if (self.$scope.categories[i].name === self.$scope.data.category[j]) {
            self.$scope.categories[i].selected = true;
          }  
        }
      }
    }
  })
  .catch(function(result) {
    self.ToastrService.parse(result);
  })
}

Dataset.prototype.update = function() {
  var self = this;
  // Collect selected categories
  self.$scope.data.category = [];
  for (var i in self.$scope.categories) {
    if (self.$scope.categories[i].selected) {
      self.$scope.data.category.push(self.$scope.categories[i].name);
    }
  }
  if (self.$scope.data.category.length < 1) {
    return alert('Silakan pilih minimal satu kategori terlebih dahulu.');
  }
  if (self.$scope.data.createdAt) {
    delete(self.$scope.data.createdAt);
  }
  self.DatasetService.update(self.$scope.data)
  .then(function(result) {
    self.list(); 
  })
  .catch(function(result) {
    self.ToastrService.parse(result);
  })
}

Dataset.prototype.someFunc = function(params) {
  var self = this;
}

Dataset.inject = [ '$stateParams', '$scope', '$state', '$window', '$rootScope', 'AuthService', 'localStorageService', 'toastr', '$location', 'ToastrService', '$modal', '$http', 'host' , 'DatasetService', '$compile', 'CategoryService', 'UserService', '$http', 'host'];

angular.module('dataset',[])
.controller('DatasetCtrl', Dataset)
;

