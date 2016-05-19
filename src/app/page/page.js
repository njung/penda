var Page = function ($scope, $state, $window, $rootScope, AuthService, PageService, localStorageService, toastr, $timeout, UserService, $stateParams, $interval, ToastrService){
  this.$scope = $scope;
  this.$state = $state;
  this.$window = $window;
  this.$rootScope = $rootScope;
  this.AuthService = AuthService;
  this.PageService = PageService;
  this.localStorageService = localStorageService
  this.toastr = toastr;
  this.$timeout = $timeout;
  this.UserService = UserService;
  this.$stateParams = $stateParams;
  this.$interval = $interval;
  this.ToastrService = ToastrService;
  var self = this;
 
  self.$scope.spinner = false;
  self.$scope.detailButton = false;
  console.log(self.$stateParams.token);
  if (self.$stateParams.token) {
    self.getByToken(self.$stateParams.token);
  } else {
    var realCheckToken = function(){
      self.AuthService.checkToken({redirect:true})
        .then(function(){
          self.UserService.getUserById(self.localStorageService.get("currentUser"))
            .success(function(data, status, headers) {
              /* self.$interval.cancel(checkToken); */
              self.$rootScope.currentUser = data.fullName;
              self.$rootScope.currentUserRule = data.rule;
            })
        })
    }
    /* var checkToken = self.$interval(function(){ */
    /*   realCheckToken(); */
    /* }, 5000) */
    realCheckToken();

    self.list(1, 10);

  }
  self.$scope.selectedPage = {};
}
    
Page.prototype.list = function(page, limit) {
  var self = this;
  self.$scope.spinner = true;
  self.$scope.showPagination = false;
  self.$scope.pages = [];
  self.PageService.list(page, limit)
    .success(function(data, status, headers) {
      self.$window.scrollTo(0,0)
      self.$scope.pages = [];
      console.log(data);
      data.page++;
      
      // Generate pagination
      self.$scope.limit = data.limit;
      self.$scope.total = data.total;
      self.$scope.pages = Math.ceil(data.total/data.limit);
      self.$scope.offset = data.page * data.limit;
      self.$scope.pageOffset = self.$scope.offset;
      self.$scope.offsetPlusLimit = self.$scope.offset + data.limit;
      console.log("limit : " + data.limit);
      console.log("total : " + data.total);
      console.log("pages : " + self.$scope.pages);
      console.log("page : " + data.page);
      console.log("offset : " + self.$scope.offset);
      console.log("pageOffset : " + self.$scope.pageOffset);
      console.log("offsetPlusLimit : " + self.$scope.offsetPlusLimit)
      //generate pagination
      self.$scope.pagination = [];
      self.$scope.next = {
        active : false, 
        page : (data.limit+1),
      };
      self.$scope.prev = {
        active : false,
      };
      self.$scope.last = {
        page : self.$scope.pages,
      };
      if (data.page == self.$scope.pages) {
        self.$scope.pageOffset = self.$scope.total;
      }
      var start = 1;
      var end = data.limit;
      if (self.$scope.pages <= data.limit) {
        end = self.$scope.pages;
      } else {
        for (var j = 1; j <= 10; j++) {
          if ((data.page-j)%data.limit === 0) {
            start = data.page-j+1;
            end = start + data.limit-1;
            self.$scope.next.active = true;
            self.$scope.next.page = end + 1;
            if (data.page > data.limit) {
              self.$scope.prev.active = true;
              self.$scope.prev.page = start - 1;
            }
            if ((end + data.limit)*data.limit > data.total) {
              self.$scope.next.active = false;
            }
          }
        }
      }
      for (var i=start;i<=end;i++){
        var page = {
          number : i,
          active : false
        }
        if (i == data.page) page.active = true;
        self.$scope.pagination.push(page);
        if (i == self.$scope.pages) {
          break;
        }
      }
      // give a delay for pagination button
      self.$timeout(function(){
        self.$scope.showPagination = true;
        self.$scope.pages = data.data;
        self.$scope.spinner = false;
      }, 1000)  
    })
    .error(function(data, status, headers) {
      console.log(data);
      console.log(status);
      if (status == 404) return self.AuthService.clearCredentials();
    });
}

Page.prototype.create = function(item) {
  console.log(item);
  var self = this;
  if (
    item.title &&
    item.url &&
    item.content
  ) {
    self.$scope.spinner = true;
    self.PageService.create(item)
      .success(function(data, status, headers) {
        self.$scope.spinner = false;
        self.back();
        self.list(1, 10);
      })
      .error(function(data, status, headers) {
        self.$scope.spinner = false;
        console.log(data);
        self.ToastrService.parse(data, status);
      })
  } else {
    self.ToastrService.validation();
  }
}

Page.prototype.update = function(p) {
  var self = this;
  var item = {
    _id : p._id,
    title : p.title,
    url : p.url,
    type : p.type,
    content : p.content
  }
  self.$scope.spinner = true;
  self.PageService.update(item)
    .success(function(data, status, headers) {
      self.$scope.spinner = false;
      self.back();
      self.list(1, 10);
    })
    .error(function(data, status, headers) {
      self.$scope.spinner = false;
      console.log(data);
      self.ToastrService.parse(data, status);
    })
}

Page.prototype.delete = function(item) {
  var self = this;
  self.$scope.spinner = true;
  self.PageService.delete(item)
    .success(function(data, status, headers) {
      self.$scope.spinner = false;
      self.back();
      self.list(1, 10);
    })
    .error(function(data, status, headers) {
      self.$scope.spinner = false;
      console.log(data);
      self.ToastrService.parse(data, status);
    })
}


Page.prototype.detail = function(item) {
  console.log("detail");
  var self = this;
  self.$window.scrollTo(0,0)
  self.$scope.detail = true;
  self.$scope.selectedPage = item;
  self.$timeout(function(){
    self.$scope.detailButton = true;
  }, 1000);
}

Page.prototype.new = function() {
  console.log("new");
  var self = this;
  self.$window.scrollTo(0,0)
  self.$scope.new = true;
  self.$scope.selectedPage = {};
  self.$timeout(function(){
    self.$scope.detailButton = true;
  }, 900);
}

Page.prototype.back = function() {
  var self = this;
  self.$window.scrollTo(0,0)
  self.$scope.detail = false;
  self.$scope.new = false;
  self.$scope.selectedPage = {};
  self.$scope.detailButton = false;
}
Page.inject = [ "$scope", "$state", "$window", "$rootScope", "AuthService", "localStorageService", "toastr" , "$timeout", "$interval", "ToastrService"];

angular.module("page",[])
.controller("PageCtrl", Page)
;

