var server = require(__dirname + '/../../../index');
var mongoose = require('mongoose');
var server = require(__dirname + '/../../../index');
var model = require(__dirname + '/../index').model();
var passportLocalMongoose = require('passport-local-mongoose');
var fs = require('fs');
var _ = require('lodash');
var uuid = require('uuid');
var moment = require('moment');
var async = require('async');
var generateUser = require(__dirname + '/../../../api/00-user/index').generateUser;
var profileModel = require(__dirname + '/../../../api/profiles/index').model();
var should = require('should');
var FormData = require('form-data');
var Stream = require('stream');
var streamToPromise = require("stream-to-promise");
var req = require('request');
var base64 = require('js-base64').Base64;
require('must');

var port = '3000';
if (process.env.PORT) port = process.env.PORT;
var prefix = 'http://localhost:' + port;
var token, token2, id;

describe('Dataset', function() {
  this.timeout(300000);
  var allDone = false;
  before(function(done){
    mongoose.connection.on('connected', function() {
      if (allDone) return;
        done();
    });
    if (!mongoose.connection.readyState) {
      mongoose.connect('mongodb://localhost/test');
    }
  })
  after(function(done) {
    allDone = true;
    mongoose.disconnect();
    done();
  });
  describe('User auth', function() {
    this.timeout(50000);
    it('should logged in and get jwt from /api/users/login', function(done) {
      var user = {
        username : 'admin',
        password : 'admin'
      }
      server.inject({
        method: 'POST',
        url: '/api/users/login',
        payload : user
      }, function(response) {
        profileModel.findOne({email:user.email}, function(err, profile){
          if (err) return done(err);
          response.result.must.be.an.object();
          response.result.success.must.equal(true);
          response.headers.token.must.be.exist();
          response.headers.current_user.must.exist();
          response.headers.current_user.toString().must.equal(profile._id.toString());
          response.headers.token.toString().length.should.greaterThan(0);
          token = response.headers.token.toString();
          user = {
            username : 'user',
            password : 'admin'
          }
          server.inject({
            method: 'POST',
            url: '/api/users/login',
            payload : user
          }, function(response) {
            token2 = response.headers.token.toString();
            done();
          })
        })
      });
    });
  });
  describe('Upload', function() {
    it("should be able to upload dataset (CSV)", function(done) {
      var formData = {
        data : JSON.stringify({
          title : 'CSV',
          source : 'somewhere',
        }),
        file : fs.createReadStream(__dirname + "/../../../test/samples/sample-1.csv"),
      }
      req.post({
        headers : { Authorization : token },
        url:'http://localhost:7000/api/upload',
        formData : formData 
      }, function optionalCallback(err, httpResponse, body) {
        if (err) {
          return done(err);
        }
        httpResponse.statusCode.must.equal(200);
        var body = JSON.parse(httpResponse.body);
        body.status.must.equal('pending');
        // wait for three second, estimated time for file processing
        setTimeout(function(){
          var path = '/api/dataset/' + body.filename;
          server.inject({
            url: path,
            method: 'GET',
          }, function(response) {
            response.result.status.must.equal('done');
            id = response.result.filename;
            done();
          });
        }, 3000)
      })
    });
    it("should be able to upload dataset (XLSX)", function(done) {
      var formData = {
        data : JSON.stringify({
          title : 'Title',
          source : 'somewhere',
          category : ['NewCategory']
        }),
        file : fs.createReadStream(__dirname + "/../../../test/samples/sample-5.xlsx"),
      }
      req.post({
        headers : { Authorization : token },
        url:'http://localhost:7000/api/upload',
        formData : formData 
      }, function optionalCallback(err, httpResponse, body) {
        if (err) {
          return done(err);
        }
        httpResponse.statusCode.must.equal(200);
        var body = JSON.parse(httpResponse.body);
        body.status.must.equal('pending');
        // wait for three second, estimated time for file processing
        setTimeout(function(){
          var path = '/api/dataset/' + body.filename;
          server.inject({
            url: path,
            method: 'GET',
          }, function(response) {
            response.result.status.must.equal('done');
            done();
          });
        }, 3000)
      })
    });
    it("should not be able to upload dataset because of missing field (field)", function(done) {
      var formData = {
        data : JSON.stringify({
          title : 'Title',
          source : 'somewhere',
        })
      }
      req.post({
        headers : { Authorization : token },
        url:'http://localhost:7000/api/upload',
        formData : formData 
      }, function optionalCallback(err, httpResponse, body) {
        if (err) {
          return done(err);
        }
        httpResponse.statusCode.must.equal(400);
        done();
      })
    });
    it("should not be able to upload dataset because of missing field (data)", function(done) {
      var formData = {
        file : fs.createReadStream(__dirname + "/../../../test/samples/sample-5.xlsx"),
      }
      req.post({
        headers : { Authorization : token },
        url:'http://localhost:7000/api/upload',
        formData : formData 
      }, function optionalCallback(err, httpResponse, body) {
        if (err) {
          return done(err);
        }
        httpResponse.statusCode.must.equal(400);
        done();
      })
    });
    it("should not be able to upload dataset because of missing field (source)", function(done) {
      var formData = {
        data : JSON.stringify({
          title : 'Title',
        }),
        file : fs.createReadStream(__dirname + "/../../../test/samples/sample-5.xlsx"),
      }
      req.post({
        headers : { Authorization : token },
        url:'http://localhost:7000/api/upload',
        formData : formData 
      }, function optionalCallback(err, httpResponse, body) {
        if (err) {
          return done(err);
        }
        httpResponse.statusCode.must.equal(400);
        done();
      })
    });
    it("should not be able to upload dataset because of missing field (title)", function(done) {
      var formData = {
        data : JSON.stringify({
          source : 'somewhere',
        }),
        file : fs.createReadStream(__dirname + "/../../../test/samples/sample-5.xlsx"),
      }
      req.post({
        headers : { Authorization : token },
        url:'http://localhost:7000/api/upload',
        formData : formData 
      }, function optionalCallback(err, httpResponse, body) {
        if (err) {
          return done(err);
        }
        httpResponse.statusCode.must.equal(400);
        done();
      })
    });
    it("should be able to upload dataset (XLS) but unable to process because of unsupported file format", function(done) {
      var formData = {
        data : JSON.stringify({
          title : 'Title',
          source : 'somewhere',
        }),
        file : fs.createReadStream(__dirname + "/../../../test/samples/sample-4.xls"),
      }
      req.post({
        headers : { Authorization : token },
        url:'http://localhost:7000/api/upload',
        formData : formData 
      }, function optionalCallback(err, httpResponse, body) {
        if (err) {
          return done(err);
        }
        httpResponse.statusCode.must.equal(200);
        var body = JSON.parse(httpResponse.body);
        body.status.must.equal('pending');
        // wait for three second, estimated time for file processing
        setTimeout(function(){
          var path = '/api/dataset/' + body.filename;
          server.inject({
            url: path,
            method: 'GET',
          }, function(response) {
            response.result.status.must.equal('error');
            response.result.error.must.equal('Non-supported file format. Please provide a .csv or .xlsx file.\n');
            done();
          });
        }, 3000)
      })
    });
    it("should be able to upload dataset (XLSX) but unable to process because of inconsisten table length", function(done) {
      var formData = {
        data : JSON.stringify({
          title : 'Title',
          source : 'somewhere',
        }),
        file : fs.createReadStream(__dirname + "/../../../test/samples/sample-2.xlsx"),
      }
      req.post({
        headers : { Authorization : token },
        url:'http://localhost:7000/api/upload',
        formData : formData 
      }, function optionalCallback(err, httpResponse, body) {
        if (err) {
          return done(err);
        }
        httpResponse.statusCode.must.equal(200);
        var body = JSON.parse(httpResponse.body);
        body.status.must.equal('pending');
        // wait for three second, estimated time for file processing
        setTimeout(function(){
          var path = '/api/dataset/' + body.filename;
          server.inject({
            url: path,
            method: 'GET',
          }, function(response) {
            // The xls file has a merge cell. This is prohibited. Should got an error.
            response.result.status.must.equal('error');
            response.result.error.must.equal('Inconsisten column length.\n');
            done();
          });
        }, 3000)
      })
    });
    it("should be able to upload dataset with non-admin privilege ", function(done) {
      var formData = {
        data : JSON.stringify({
          title : 'Title',
          source : 'somewhere',
        }),
        file : fs.createReadStream(__dirname + "/../../../test/samples/sample-1.csv"),
      }
      req.post({
        headers : { Authorization : token2 },
        url:'http://localhost:7000/api/upload',
        formData : formData 
      }, function optionalCallback(err, httpResponse, body) {
        if (err) {
          return done(err);
        }
        httpResponse.statusCode.must.equal(200);
        done();
      })
    });
    it("should not be able to upload dataset with invalid credential", function(done) {
      var formData = {
        data : JSON.stringify({
          title : 'Title',
          source : 'somewhere',
        }),
        file : fs.createReadStream(__dirname + "/../../../test/samples/sample-1.csv"),
      }
      req.post({
        headers : { Authorization : token + 'x' },
        url:'http://localhost:7000/api/upload',
        formData : formData 
      }, function optionalCallback(err, httpResponse, body) {
        if (err) {
          return done(err);
        }
        var body = JSON.parse(httpResponse.body);
        body.statusCode.must.equal(401);
        body.error.must.equal('Unauthorized');
        done();
      })
    });
  });
  describe('List', function() {
    it("should be able to list datasets", function(done) {
      var path = '/api/datasets';
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.total.must.equal(5);
        response.result.page.must.equal(1);
        response.result.limit.must.equal(10);
        response.result.data.length.must.equal(5);
        done();
      });
    });
    it("should be able to list datasets with specific page and limit", function(done) {
      var path = '/api/datasets?page=2&limit=2';
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.total.must.equal(5);
        response.result.page.must.equal(2);
        response.result.limit.must.equal(2);
        response.result.data.length.must.equal(2);
        done();
      });
    });
    it("should be able to list datasets with non existing page, resulting an empty array", function(done) {
      var path = '/api/datasets?page=10&limit=2';
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.total.must.equal(5);
        response.result.page.must.equal(10);
        response.result.limit.must.equal(2);
        response.result.data.length.must.equal(0);
        done();
      });
    });
    it("should be able to list datasets that has error status", function(done) {
      var path = '/api/datasets?status=error';
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.total.must.equal(2);
        response.result.page.must.equal(1);
        response.result.limit.must.equal(10);
        response.result.data.length.must.equal(2);
        done();
      });
    });
    it("should be able to list datasets that has specific title string", function(done) {
      var path = '/api/datasets?title=CSV';
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.total.must.equal(1);
        response.result.page.must.equal(1);
        response.result.limit.must.equal(10);
        response.result.data.length.must.equal(1);
        response.result.data[0].title.must.equal('CSV');
        done();
      });
    });
    it("should be able to list datasets that has specific category", function(done) {
      var path = '/api/datasets?category=NewCategory';
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.total.must.equal(1);
        response.result.page.must.equal(1);
        response.result.limit.must.equal(10);
        response.result.data.length.must.equal(1);
        done();
      });
    });
  });
  describe('Read', function() {
    it("should be able to get a dataset", function(done) {
      var path = '/api/dataset/' + id;
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.title.must.exist();
        response.result.source.must.exist();
        response.result.status.must.exist();
        response.result.title.must.equal('CSV');
        response.result.status.must.equal('done');
        done();
      });
    });
    it("should be able to query a dataset", function(done) {
      var query = 'select * from ' + id;
      query = base64.encode(query);
      var path = '/api/dataset/' + id + '?sql=' + query;
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.length.must.equal(5);
        response.result[0].uid.must.equal(1);
        response.result[0].tahun.must.equal(2011);
        response.result[0].acehtimur.must.equal(736800);
        response.result[0].acehutara.must.equal(30213478);
        response.result[0].acehtamiang.must.equal(0);
        done();
      });
    });
    it("should be able to query a dataset with more advanced sql command", function(done) {
      var query = 'select uid from ' + id + ' where tahun=2012';
      query = base64.encode(query);
      var path = '/api/dataset/' + id + '?sql=' + query;
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.length.must.equal(2);
        response.result[0].uid.must.equal(2);
        response.result[1].uid.must.equal(7);
        done();
      });
    });
    it("should not be able to query with invalid id", function(done) {
      var query = 'select * from ' + id + 'x';
      query = base64.encode(query);
      var path = '/api/dataset/' + id + '?sql=' + query;
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
        console.log(response.statusCode);
        console.log(response.result);
        done();
      });
    });
    it("should be able to query a dataset with more advanced sql command with CSV result", function(done) {
      var query = 'select uid from ' + id + ' where tahun=2012';
      query = base64.encode(query);
      var path = '/api/dataset/' + id + '?sql=' + query + '&type=csv';
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.must.equal('uid\r\n2\r\n7\r\n12\r\n17');
        done();
      });
    });
    it("should be able to download a csv file of the dataset", function(done) {
      var path = '/api/dataset/' + id + '?type=csv';
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
				response.headers['content-type'].must.equal('application/octet-stream');
				response.headers['content-disposition'].must.equal('attachment; filename=' + id + '.csv;');
        done();
      });
    });
    it("should be able to download a xlsx file of the dataset", function(done) {
      var path = '/api/dataset/' + id + '?type=xlsx';
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
				response.headers['content-type'].must.equal('application/octet-stream');
				response.headers['content-disposition'].must.equal('attachment; filename=' + id + '.xlsx;');
        done();
      });
    });
  });
  describe('Update', function() {
    it("should be able to update a dataset", function(done) {
      var path = '/api/dataset/' + id;
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: 'GET',
      }, function(response) {
        response.result.title.must.exist();
        response.result.source.must.exist();
        response.result.status.must.exist();
        response.result.title.must.equal('CSV');
        response.result.status.must.equal('done');
				var payload = {};
				var keys = Object.keys(response.result._doc);
				for (var i in keys) {
					if (keys[i] !== 'createdAt') {
						payload[keys[i]] = response.result[keys[i]];
					}
				}
				payload.title = 'Title for CSV';
        server.inject({
          headers : { Authorization : token },
          url: path,
          method: 'POST',
					payload : payload,
        }, function(response) {
					response.result.title.must.equal('Title for CSV');
          done();
        });
      });
    });
    it("should not be able to update a dataset if there is invalid field", function(done) {
      var path = '/api/dataset/' + id;
      server.inject({
        headers : { Authorization : token },
        url: path,
        method: 'GET',
      }, function(response) {
				var payload = {};
				var keys = Object.keys(response.result._doc);
				for (var i in keys) {
					if (keys[i] !== 'createdAt') {
						payload[keys[i]] = response.result[keys[i]];
					}
				}
				payload.invalid = 'field';
        server.inject({
          headers : { Authorization : token },
          url: path,
          method: 'POST',
					payload : payload,
        }, function(response) {
					response.result.statusCode.must.equal(400);
          done();
        });
      });
    });
    it("should not be able to update a dataset if there is no credential", function(done) {
      var path = '/api/dataset/' + id;
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
				var payload = {};
				var keys = Object.keys(response.result._doc);
				for (var i in keys) {
					if (keys[i] !== 'createdAt') {
						payload[keys[i]] = response.result[keys[i]];
					}
				}
				payload.title = 'Title';
        server.inject({
          url: path,
          method: 'POST',
					payload : payload,
        }, function(response) {
          response.result.statusCode.must.equal(401);
          response.result.error.must.equal('Unauthorized');
          done();
        });
      });
    });
    it("should not be able to update a dataset if the uploader is not the dataset owner and not an admin either", function(done) {
      var path = '/api/dataset/' + id;
      server.inject({
        url: path,
        method: 'GET',
      }, function(response) {
				var payload = {};
				var keys = Object.keys(response.result._doc);
				for (var i in keys) {
					if (keys[i] !== 'createdAt') {
						payload[keys[i]] = response.result[keys[i]];
					}
				}
				payload.title = 'Title';
        server.inject({
          headers : { Authorization : token2 },
          url: path,
          method: 'POST',
					payload : payload,
        }, function(response) {
          response.result.statusCode.must.equal(401);
          response.result.error.must.equal('Unauthorized');
          done();
        });
      });
    });
  });
  describe('Delete', function() {
    it("should not be able to delete a dataset if there is no credential", function(done) {
      var path = '/api/dataset/' + id;
      server.inject({
        url: path,
        method: 'DELETE',
      }, function(response) {
        response.result.statusCode.must.equal(401);
        response.result.error.must.equal('Unauthorized');
				done();
      });
  	});
    it("should not be able to delete a dataset if the credential isn't the original uploader and not an admin", function(done) {
      var path = '/api/dataset/' + id;
      server.inject({
        url: path,
        method: 'DELETE',
        headers : { Authorization : token2 },
      }, function(response) {
        response.result.statusCode.must.equal(401);
        response.result.error.must.equal('Unauthorized');
				done();
      });
  	});
    it("should not be able to delete a dataset if the id is invalid", function(done) {
      var path = '/api/dataset/' + id + 'x';
      server.inject({
        url: path,
        method: 'DELETE',
        headers : { Authorization : token },
      }, function(response) {
        response.result.statusCode.must.equal(404);
        response.result.error.must.equal('Not Found');
				done();
      });
  	});
    it("should be able to delete a dataset", function(done) {
      var path = '/api/dataset/' + id;
      server.inject({
        url: path,
        method: 'DELETE',
        headers : { Authorization : token },
      }, function(response) {
        var path = '/api/dataset/' + id;
        server.inject({
          url: path,
          method: 'GET',
        	headers : { Authorization : token },
        }, function(response) {
					response.result.status.must.equal('deleted');
					done();
        });
      });
  	});
  });
});
