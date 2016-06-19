var fs = require("fs");

var populate = function(server) {
  var sources = [];
  var dirs = fs.readdirSync(__dirname);
  for (var i in dirs) {
    var dir = __dirname + "/" + dirs[i];
    var settings = {};
    if (fs.existsSync(dir + ".settings.json")) {
      settings = require(dir + ".settings.json");
    }
    var options = settings.options || {};
    console.log(options);
    if (fs.existsSync(dir + "/package.json")) {
      var pkg = require(dir + "/package.json");

      var routeSettings = {};
      if (settings.prefix) {
        routeSettings.prefix = settings.prefix;
      }
      server.register({
        register: require(dir + "/" + pkg.main),
        options: options 
      }, {
        select: ["api"],
        routes: routeSettings
      }, function(err) {
        if (err) {
          console.log("Error registering sources " + dir, err);
        }
      }
      );
    }
  }
}

exports.populate = populate;
