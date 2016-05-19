if (process.env.NODE_ENV === 'test') {
  console.log = function() {}
}

var fs = require("fs");

var populate = function() {
  var dirs = fs.readdirSync(__dirname);
  for (var i in dirs) {
    var dir = __dirname + "/" + dirs[i];
    if (fs.existsSync(dir + "/test/index.js")) {
      require(dir + "/test/index.js")
      console.log(dir);
    }
  }
}


populate();
