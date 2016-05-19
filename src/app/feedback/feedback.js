var Feedback = function ($scope, $state, $window, $rootScope, AuthService, FeedbackService, localStorageService, toastr, $timeout, UserService, $stateParams, $interval, ToastrService){
  this.$scope = $scope;
  this.$state = $state;
  this.$window = $window;
  this.$rootScope = $rootScope;
  this.AuthService = AuthService;
  this.FeedbackService = FeedbackService;
  this.localStorageService = localStorageService
  this.toastr = toastr;
  this.$timeout = $timeout;
  this.UserService = UserService;
  this.$stateParams = $stateParams;
  this.$interval = $interval;
  this.ToastrService = ToastrService;
  var self = this;
 
  self.$scope.spinner = false;
  self.$scope.feedbackForm = {};

  self.$scope.submit = function(feedback) {
    self.$scope.spinner = true;
    self.FeedbackService.create(feedback)
      .success(function(data, status, headers) {
        self.$scope.spinner = false;
        alert('Terima kasih atas saran / kritik Anda.');
        self.$rootScope.feedbackModal.dismiss();
      })
      .error(function(data, status, headers) {
        self.$scope.spinner = false;
        console.log(data);
        self.ToastrService.parse(data, status);
      })
  }
}
    

Feedback.inject = [ "$scope", "$state", "$window", "$rootScope", "AuthService", "localStorageService", "toastr" , "$timeout", "$interval", "ToastrService"];

angular.module("feedback",[])
.controller("FeedbackCtrl", Feedback)
;

