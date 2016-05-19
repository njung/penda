'use strict';
var UploadService = function($http, AuthService, host, localStorageService, $upload) {
  this.$http = $http;
  this.host = host;
  this.AuthService = AuthService;
  this.localStorageService = localStorageService;
  this.$upload = $upload;
  var self = this;
}

UploadService.prototype.uploadAvatar = function(file) {
  var self = this;
  var path = "/api/user/" + self.localStorageService.get("currentUser") + "/avatar";
  return self.$upload.upload({
    url : self.host + path,
    headers : {
      Authorization : self.AuthService.generateMac(path, "POST")
    },
    file: file,
    fileFormDataName : "avatar",
  });
}

UploadService.prototype.uploadSettingsImg = function(id, files) {
  var self = this;
  var path = "/api/setting/" + id + "/img";
  return self.$upload.upload({
    url : self.host + path,
    headers : {
      Authorization : self.AuthService.generateMac(path, "POST")
    },
    file: files[0],
    fileFormDataName : "img",
  });
}


UploadService.inject = ["$http", "AuthService", "host", "localStorageService"]

angular.module('uploadService', [])
.service("UploadService", UploadService)

