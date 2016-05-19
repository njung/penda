var Profile = function($scope, $http, AuthService, host, localStorageService, toastr, $upload, UserService, UploadService, ToastrService, $rootScope, $modal) {
  this.$http = $http;
  this.host = host;
  this.AuthService = AuthService;
  this.UserService = UserService;
  this.UploadService = UploadService;
  this.$scope = $scope;
  this.toastr = toastr;
  this.localStorageService = localStorageService;
  this.$upload = $upload;
  this.ToastrService = ToastrService;
  this.$rootScope = $rootScope;
  this.$modal = $modal;
  var self = this;

  // Init
  self.spinner = {};
  self.getUserById(self.localStorageService.get("currentUser"));
  self.getAvatarById(self.localStorageService.get("currentUser"));

  // Avatar specific code

  self.$rootScope.myImage='';
  self.$rootScope.avatar='';

  self.$scope.clearFileTarget = function() {
    angular.element(document.querySelector('#avatar-upload')).val('');
  }

  var handleFileSelect = function(evt) {
    var file = evt.currentTarget.files[0];
    var reader = new FileReader();
    reader.onload = function(evt) {
      self.$scope.$apply(function($scope){
        self.$rootScope.cropAvatarModal = self.$modal.open({
          templateUrl : 'cropAvatarModal.html',
          size:'sm',
          controller : 'CropAvatarCtrl',
        })
        $rootScope.myImage = evt.target.result;
      })
    }
    reader.readAsDataURL(file);
  }
  angular.element(document.querySelector('#avatar-upload')).on('change', handleFileSelect);
}

Profile.prototype.getUserById = function(id) {
  var self = this;
  self.UserService.getUserById(id)
    .success(function(data, status, headers, config) {
      self.$scope.profile = data;
    })
}

Profile.prototype.getAvatarById = function(id) {
  var self = this;
  self.$rootScope.avatar = self.host + "/api/user/" + self.localStorageService.get("currentUser") + "/avatar" + "?" + new Date().valueOf();
}

Profile.prototype.setPassword = function(password) {
  var self = this;
  if (password.current && password.new) {
    self.spinner.changePassword = true;
    self.UserService.setPassword(password)
      .success(function(data, status, headers, config) {
        self.$scope.passwordSpinner = false;
        if (!data.success) return self.toastr.error("Invalid current password", "Toastr");
        self.toastr.success("Kata sandi berhasil diganti", "Sukses");
        password.current = "";
        password.new = "";
        password.repeat = "";
        self.spinner.changePassword = false;
      })
      .error(function(data, status, headers) {
        self.spinner.changePassword = false;
        self.ToastrService.parse(data, status);
      });
    }
}

Profile.prototype.updateProfile = function(profile) {
  var self = this;
  self.spinner.profile = true;
  if (profile.facebook && profile.facebook.indexOf('http://') < 0) {
    profile.facebook = 'http://' + profile.facebook;
  }
  if (profile.twitter && profile.twitter.indexOf('http://') < 0) {
    profile.twitter = 'http://' + profile.twitter;
  }
  if (profile.blog && profile.blog.indexOf('http://') < 0) {
    profile.blog = 'http://' + profile.blog;
  }
  if (profile.instagram && profile.instagram.indexOf('http://') < 0) {
    profile.instagram = 'http://' + profile.instagram;
  }
  if (profile.facebook && profile.facebook.indexOf('http://') < 0) {
    profile.facebook = 'http://' + profile.facebook;
  }
  self.UserService.updateProfile(profile)
    .success(function(data, status, headers, config) {
      if (self.$rootScope.avatar && self.$rootScope.avatar.length > 0) return self.uploadAvatar(self.$scope.files, function(){
        self.toastr.success("Profil berhasil diperbarui", "Sukses");
        self.spinner.profile = false;
        self.$rootScope.goTo('main', 'profile',{id : profile._id})
      });
      self.toastr.success("Profil berhasil diperbarui", "Sukses");
      self.spinner.profile = false;
      self.$rootScope.goTo('main', 'profile',{id : profile._id})
    })
    .error(function(data, status, headers) {
      self.spinner.profile = false;
      self.ToastrService.parse(data, status);
    });
}

Profile.prototype.uploadAvatar = function(files, cb) {
  var self = this;
  // convert base64 to blob
  var binary = atob(self.$rootScope.avatar.split(',')[1]), array = [];
  for (var i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
  var blob = new Blob([new Uint8Array(array)], {type:'image/png', encoding : 'utf-8'});
  var avatarFile = new File([blob], 'avatar.png', {type: 'image/png'});
  self.UploadService.uploadAvatar(avatarFile)
    .progress(function(evt) {
      console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
    })
    .success(function(data, status, headers, config) {
      self.spinner.profile = false;
      self.getAvatarById(self.localStorageService.get("currentUser"));
      if (cb) {
        cb();
      }
    })
    .error(function(data, status, headers) {
      self.spinner.profile = false;
      self.ToastrService.parse(data, status);
    });
};


/* Profile.prototype.uploadAvatar = function(){ */
/*   var self = this; */
/*   self.$scope.editProfile = true; */
/*   self.$scope.editSpinner = true; */
/*   self.ProfileService.updateAvatar(self.$rootScope.avatar) */
/*     .then(function(data){ */
/*       console.log("avatar successfully updated"); */
/*       console.log(data); */
/*       self.$scope.editSpinner = false; */
/*     }) */
/*     .catch(function(data, status){ */
/*       console.log(data); */
/*       console.log(status); */
/*       self.$scope.editSpinner = false; */
/*       self.ErrorService.parse(data, status); */
/*     }) */
/* } */

/* Profile.prototype.cancelAvatar = function(){ */
/*   var self = this; */
/*   self.newAvatar = self.prevAvatar; */
/*   self.$scope.editProfile = true; */
/* } */



Profile.inject = ['$scope', '$http', 'AuthService', 'host', 'localStorageService', 'toastr', '$upload', 'UserService', 'UploadService', 'ToastrService', '$rootScope', '$modal']

angular.module("profile",[])
.directive('errSrc', function() {
  return {
    link: function(scope, element, attrs) {
      element.bind('error', function() {
        if (attrs.src != attrs.errSrc) {
          attrs.$set('src', attrs.errSrc);
        }
      });
    }
  }
})
.controller("ProfileCtrl", Profile)

