'use strict';
var totalUserCount;

angular.module('App', [
  'ui.router', 
  'ui.bootstrap',
  'ngAnimate',
  'html',
  'start',
  'login',
  'signup',
  'confirm',
  'passrec',
  'user',
  'category',
  'dataset',
  'upload',
  'logout',
  'notfound',
  'feedback',
  'alert',
  // Services
  'menu',
  'alertService',
  'authService',
  'userService',
  'categoryService',
  'toastrService',
  'uploadService',
  'feedbackService',
  'datasetService',

  'LocalStorageModule',
  'toastr',
  'ngFileUpload',
  'slick',
  'angularMoment',
  'colorpicker.module',
  'ui.tinymce',
  'ngProgress',
  'ui.utils.masks',
  'infinite-scroll',
  'ngImgCrop',
  'debounce',
  'fcsa-number',
  'ngDropdowns',
  'leaflet-directive'
])
// The controller declared in their html file
.config(function($stateProvider, $urlRouterProvider, toastrConfig) {

  $urlRouterProvider.otherwise('/start/');
  $stateProvider
  .state('start', {
      url: '/start/{params}',
      cache: false,
      templateProvider: function($templateCache) {
        return $templateCache.get('start/start.html');
      }
    }
  )
  .state('login', {
      url: '/login/{params}',
      cache: false,
      templateProvider: function($templateCache) {
        return $templateCache.get('login/login.html');
      }
    }
  )
  .state('signup', {
      url: '/signup',
      cache: false,
      templateProvider: function($templateCache) {
        return $templateCache.get('signup/signup.html');
      }
    }
  )
  .state('confirm', {
      url: '/confirm/{code}',
      cache: false,
      templateProvider: function($templateCache) {
        return $templateCache.get('confirm/confirm.html');
      }
    }
  )
  .state('passrec', {
      url: '/passrec/{code}',
      cache: false,
      templateProvider: function($templateCache) {
        return $templateCache.get('passrec/passrec.html');
      }
    }
  )
  .state('setting', {
      url: '/settings/{type}',
      cache: false,
      templateProvider: function($templateCache) {
        return $templateCache.get('setting/setting.html');
      }
    }
  )
  .state('user', {
      url: '/user/{mode}',
      cache: false,
      templateProvider: function($templateCache) {
        return $templateCache.get('user/user.html');
      }
    }
  )
  .state('category', {
      url: '/category/{mode}',
      cache: false,
      templateProvider: function($templateCache) {
        return $templateCache.get('category/category.html');
      }
    }
  )
  .state('dataset', {
      url: '/dataset/{mode}',
      cache: false,
      templateProvider: function($templateCache) {
        return $templateCache.get('dataset/dataset.html');
      }
    }
  )
  .state('upload', {
      url: '/upload/{mode}',
      cache: false,
      templateProvider: function($templateCache) {
        return $templateCache.get('upload/upload.html');
      }
    }
  )
  .state('notfound', {
      url: '/notfound',
      cache: false,
      templateProvider: function($templateCache) {
        return $templateCache.get('notfound/notfound.html');
      }
    }
  )
  .state('logout', {
      url: '/logout',
      cache: false,
      controller: 'LogoutCtrl'
    }
  )
})
.controller('AppCtrl', function($scope) {
})
.run([ '$rootScope', '$state', '$stateParams', 'amMoment', 'AuthService', 'UserService', 'ngProgressFactory',
  function ($rootScope, $state, $stateParams, amMoment, AuthService, UserService, ngProgressFactory) {
    amMoment.changeLocale('id');
    AuthService.checkToken({redirect:false});
    $rootScope.loading = ngProgressFactory.createInstance();
    $rootScope.loading.setColor('black');
    
    // Initialize essential global object
    
    $rootScope.state = $state;
    // Used to force reload the current state
    $rootScope.goTo = function(state, mode, obj) {
      if (obj) {
        obj.mode = mode;
      } else {
        obj = {
          mode : mode
        }
      }
      $state.transitionTo(state, obj, {
        reload : true,
        inherit : true,
        notify : true
      });
    }
  }
])


