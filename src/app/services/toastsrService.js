'use strict';
var Toastr = function($http, AuthService, host, localStorageService, toastr, $state) {
  this.$http = $http;
  this.host = host;
  this.AuthService = AuthService;
  this.localStorageService = localStorageService;
  this.toastr = toastr;
  this.$state = $state;
  var self = this;
}

Toastr.prototype.accountActivated = function() {
  var self = this;
  self.toastr.success('Akun Anda telah aktif.\nSilakan login.');
}

Toastr.prototype.unavailable = function() {
  var self = this;
  self.toastr.error('Server tidak dapat diakses. Cobalah beberapa saat lagi', 'Galat');
}

Toastr.prototype.connectionToastr = function() {
  var self = this;
  self.toastr.error('Server tidak dapat diakses. Periksa koneksi internet Anda', 'Galat');
}

Toastr.prototype.timeStamp = function() {
  var self = this;
  self.toastr.error('Terjadi galat. Silakan koreksi tanggal dan jam di perangkat Anda', 'Galat');
}

Toastr.prototype.notFound = function() {
  var self = this;
  /* self.toastr.error('Tidak ditemukan', 'Galat'); */
  self.$state.go('notfound');
}

Toastr.prototype.invalidLogin = function() {
  var self = this;
  self.toastr.error('Surat elektronik atau kata sandi yang Anda masukkan tidak benar', 'Galat');
}

Toastr.prototype.unauthorized = function() {
  var self = this;
  self.AuthService.clearCredentials();
}

Toastr.prototype.error = function() {
  var self = this;
  self.toastr.error('Terjadi kesalahan sistem', 'Galat');
}

Toastr.prototype.userAlreadyExists = function() {
  var self = this;
  self.toastr.error('Surat elektronik sudah terdaftar', 'Maaf');
}

Toastr.prototype.inactive = function() {
  var self = this;
  self.toastr.error('Akun Anda belum aktif. Silakan cek surel Anda untuk mengkonfirmasi akun Anda', 'Maaf');
}

Toastr.prototype.validation = function() {
  var self = this;
  self.toastr.error('Ada beberapa isian yang kurang / tidak tepat. Silakan periksa kembali isian Anda', 'Maaf');
}

Toastr.prototype.tripDateConflict = function() {
  var self = this;
  self.toastr.error('Jadwal perjalanan ini bertabrakan dengan jadwal perjalanan Anda yang sudah ada.', 'Maaf');
}

Toastr.prototype.parse = function(data, status) {
  console.log('universal toastr');
  console.log(data);
  console.log(status);
  var self = this;
  if (data.data && data.data.error === 'Conflict date') return self.tripDateConflict();
  if ((!status && !data) || status == 502 || status == 503) return self.unavailable();
  if (data.error === 'Not Found' && data.statusCode === 404) return self.notFound();
  if (data.error === 'Bad Request' && data.validation) return self.validation();
  if (data.message && data.message.substr(0,19) == 'User already exists') return self.userAlreadyExists();
  if (data.message === 'Unknown credentials') return self.invalidLogin();
  if (data.message === 'Not active') return self.inactive();
  if (data.message === 'Invalid email address') return self.invalidEmail();
  if (status == 500 || status == 400) return self.error();
  if (status == 401) return self.unauthorized();
  if (data.status == 500 || data.status == 400) return self.error();
  if (data.status == 401) return self.unauthorized();

}

Toastr.inject = ['$http', 'AuthService', 'host', 'localStorageService', 'toastr', '$state']

angular.module('toastrService', [])
.service('ToastrService', Toastr)

