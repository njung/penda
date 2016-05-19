var Logout = function (AuthService){
  this.AuthService = AuthService;
  var self = this;
  
  self.AuthService.logout();

}

Logout.inject = ["AuthService"];

angular.module("logout",[])
.controller("LogoutCtrl", Logout)
;


