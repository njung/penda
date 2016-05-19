var gulp    = require("gulp");
var uglify = require("gulp-uglify");
var concat  = require("gulp-concat");
var clean   = require("gulp-rimraf");
var files   = require("./files.json");
var runSequence = require('run-sequence');
var ngHtml2Js = require("gulp-ng-html2js");
var minifyHtml = require("gulp-minify-html");
var replace = require("gulp-batch-replace");
var fs = require("fs");
var pkgDetail = JSON.parse(fs.readFileSync(__dirname + '/package.json'));

var lr;
var bootMode = "normal";

for (i = 0; i < process.argv.length; i ++) {
  if (process.argv[i] == "--bootmode=test") {
    bootMode = "test";
  }
}

var config = {
  mode: process.env.NODE_ENV || "dev"
}

console.log("Running in " + config.mode + " mode...");
var mainJsonPath = '/config/' + config.mode + '/main.json';
var replacements = [];
if (fs.existsSync(__dirname + mainJsonPath)) {
  try {
    replacements = JSON.parse(fs.readFileSync(__dirname + mainJsonPath)) ;
  } catch(e) {
    console.error("config/main.json has error: ", e);
    process.exit(-1);
  }
}

replacements.push(['_VERSION_', pkgDetail.version])
console.log(replacements);
for (var i in replacements) {
  if (replacements[i][0] == '_APP_NAME_') {
    replacements[i][1] += ' - ' + pkgDetail.version;
  }
}

console.log("Settings: ", replacements);
gulp.task("clean", function() {
  return gulp.src(["www/*"], {read:false}).pipe(clean());
});

gulp.task("maps", function() {
  gulp.src(files.maps)
  .pipe(gulp.dest("./public"))
});

gulp.task("libs", ["maps"], function() {
  gulp.src(files.libs)
  .pipe(concat("libs.js"))
  .pipe(gulp.dest("./public/"))
});

gulp.task("fa", function() {
  gulp.src(files.fa)
  .pipe(gulp.dest("./public/fontawesome/"))
});

gulp.task("styles", ["fa"], function() {
  gulp.src(files.styles)
  .pipe(concat("app.css"))
  .pipe(gulp.dest("./public/"))
});

gulp.task("images", function() {
  gulp.src(files.images)
  .pipe(gulp.dest("./public/assets/img"))
});


gulp.task("favicon", function() {
  gulp.src("src/img/favicon.ico")
  .pipe(gulp.dest("./public"));
});
gulp.task("skins", function() {
  gulp.src(files.skins)
  .pipe(gulp.dest("./public/skins/lightgray"))
});
gulp.task("tinymcefonts", function() {
  gulp.src(files.tinymcefonts)
  .pipe(gulp.dest("./public/skins/lightgray/fonts"))
});
gulp.task("fonts", function() {
  gulp.src(files.fonts)
  .pipe(gulp.dest("./public/fonts"))
});

gulp.task("html", function() {
  gulp.src("src/index.html")
  .pipe(replace(replacements))
  .pipe(gulp.dest("./public"));
  
  gulp.src("src/socket.io.js")
  .pipe(gulp.dest("./public/socket.io"));

  gulp.src(files.html)
  /* .pipe(minifyHtml({ */
  /*   empty: true, */
  /*   spare: true, */
  /*   quotes: true */
  /* })) */
  .pipe(ngHtml2Js({
    moduleName: "html"
  }))
  .pipe(concat("html.min.js"))
  .pipe(uglify())
  .pipe(replace(replacements))
  .pipe(gulp.dest("./public"))
});

gulp.task("src", ["html", "images"], function() {

  if (bootMode == "normal") {
    files.src.push("boot/prod/boot.js");
  } else {
    files.src.push("boot/dev/boot.js");
  }

  gulp.src(files.src)
  .pipe(replace(replacements))
  .pipe(concat("src.js"))
  .pipe(gulp.dest("./public"))
});

gulp.task("watch", function(){
  startServer();
  startLiveReload();
  gulp.watch(["src/**", "src/**/**"], notifyLivereload);
});

var tasks = ["clean", "styles", "libs", "src", "fonts", "favicon", "skins", "tinymcefonts"];

gulp.task("default", tasks);
