var config     = require(__dirname + '/config.json');
var mysql      = require('mysql');
var connection = mysql.createConnection(config);
var md5        = require('md5');
var async      = require('async');
var mongoose   = require('mongoose');
var dbConfig   = require(__dirname + '/../hapi-mongoose-db-connector.settings.json');
var userSchema = require(__dirname + '/../00-user/index').schema;
var profileSchema = require(__dirname + '/../profiles/index').schema;
var mongo = mongoose.createConnection(dbConfig.options.mongodbUrl);
var UserModel = mongo.model('users', userSchema);
var ProfileModel = mongo.model('profiles', profileSchema);

var dropTables = function(cb) {
  UserModel.remove({}, function(err){
    if (err) {
      console.log(err);
      process.exit();
    }
    ProfileModel.remove({}, function(err){
      if (err) {
        console.log(err);
        process.exit();
      }
      cb();
    })
  })
}

connection.connect(function(err) {
  if (err) {
    console.log(err);
    process.exit();
  }
  /* var sql = 'select *, adm_groups.name as group_name from adm_users JOIN adm_users_groups ON adm_users.id=adm_users_groups.user_id JOIN adm_groups ON adm_users_groups.group_id=adm_groups.id'; */
  var sql = 'select *, adm_groups.name as group_name, m_skpa.name as name from adm_users JOIN adm_users_groups ON adm_users.id=adm_users_groups.user_id JOIN adm_groups ON adm_users_groups.group_id=adm_groups.id JOIN m_skpa ON adm_users.company=m_skpa.id';
  console.log('Sync in progress...');
  connection.query(sql, function(err, rows, fields) {
    if (err) {
      console.log(err);
      process.exit();
    }
    var groups = [];
    dropTables(function(){
      async.eachSeries(rows, function(row, cb) {
        if (groups.indexOf(row.group_name) < 0) {
          groups.push(row.group_name);
        }
        var user = {
          isActive : true,
          password : row.password,
          username : row.username,
        }
        var profile = {
          username : row.username,
          email : row.email,
          fullName : row.name,
          group : row.group_name,
        }
  
        console.log(profile);
        if (row.group_name === 'Sys Admin') {
          profile.role = 'admin';
          // Set all admin's password to 'admin'
          /* user.password = '21232f297a57a5a743894a0e4a801fc3'; */
        } else {
          profile.role = 'user';
        }
        var u = new UserModel(user);
        u.save(function(err, result){
          if (err) {
            console.log(err);
            return cb(err);
          }
          var p = new ProfileModel(profile);
          p.userId = result._id;
          p.save(function(err, result){
            if (err) {
              console.log(err);
              return cb(err);
            }
            cb();
          });
        });
      }, function(err){
        if (err) {
          console.log(err);
        }
        console.log('Done');
        connection.end();
        process.exit();
      })
    })
  });
});
