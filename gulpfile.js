var gulp    = require('gulp');
var uglify = require('gulp-uglify');
var concat  = require('gulp-concat');
var clean   = require('gulp-rimraf');
var files   = require('./files.json');
var runSequence = require('run-sequence');
var ngHtml2Js = require('gulp-ng-html2js');
var minifyHtml = require('gulp-minify-html');
var replace = require('gulp-batch-replace');
var gulpSequence = require('gulp-sequence');
var fs = require('fs');
var pkgDetail = JSON.parse(fs.readFileSync(__dirname + '/package.json'));
var markdown2html = require('markdown-to-html').Markdown;
var md = new markdown2html();
md.bufmax = 2048;

var bootMode = 'normal';

for (i = 0; i < process.argv.length; i ++) {
  if (process.argv[i] == '--bootmode=test') {
    bootMode = 'test';
  }
}

var config = require(__dirname + '/config.json');
config.mode = process.env.NODE_ENV || 'dev';
config.syncUser = true;
try {
  fs.accessSync(__dirname + '/../../api/penda-ppid-sync', fs.F_OK);
} catch(e) {
  config.syncUser = false;
}

console.log('Running in ' + config.mode + ' mode...');
var mainJsonPath = '/config/' + config.mode + '/main.json';
var replacements = [];
if (fs.existsSync(__dirname + mainJsonPath)) {
  try {
    replacements = JSON.parse(fs.readFileSync(__dirname + mainJsonPath)) ;
  } catch(e) {
    console.error('config/main.json has error: ', e);
    process.exit(-1);
  }
}

replacements.push(['_VERSION_', pkgDetail.version])
replacements.push(['_AUTH_STRATEGY_', config.authStrategy]);
replacements.push(['_APP_NAME_', config.appName]);
replacements.push(['_SYNC_USER_', config.syncUser]);
replacements.push(['_RSS_URL_', config.rss.url]);
replacements.push(['_RSS_TITLE_', config.rss.title]);
console.log(replacements);
for (var i in replacements) {
  if (replacements[i][0] == '_APP_NAME_' && config.showVersion) {
    replacements[i][1] += ' - ' + pkgDetail.version;
  }
}


console.log('Settings: ', replacements);
gulp.task('clean', function() {
  return gulp.src(['www/*'], {read:false}).pipe(clean());
});

gulp.task('maps', function() {
  gulp.src(files.maps)
  .pipe(gulp.dest('./public'))
});

gulp.task('libs', ['maps'], function() {
  gulp.src(files.libs)
  .pipe(concat('libs.js'))
  .pipe(gulp.dest('./public/'))
});

gulp.task('fa', function() {
  gulp.src(files.fa)
  .pipe(gulp.dest('./public/fontawesome/'))
});

gulp.task('styles', ['fa'], function() {
  gulp.src(files.styles)
  .pipe(concat('app.css'))
  .pipe(gulp.dest('./public/'))
});

gulp.task('images', function() {
  gulp.src(files.images)
  .pipe(gulp.dest('./public/assets/img'))
});


gulp.task('favicon', function() {
  gulp.src('src/img/favicon.ico')
  .pipe(gulp.dest('./public'));
});
gulp.task('skins', function() {
  gulp.src(files.skins)
  .pipe(gulp.dest('./public/skins/lightgray'))
});
gulp.task('tinymcefonts', function() {
  gulp.src(files.tinymcefonts)
  .pipe(gulp.dest('./public/skins/lightgray/fonts'))
});
gulp.task('fonts', function() {
  gulp.src(files.fonts)
  .pipe(gulp.dest('./public/fonts'))
});

gulp.task('footer', function(cb) {
  var dest = __dirname + '/src/footer.html';
  fs.writeFile(dest, '<script type="text/ng-template" id="footer.html">', function(err){
    var ws = fs.createWriteStream(__dirname + '/src/footer.html');
    md.once('end', function(){
      cb();
    });
    md.render(__dirname + '/FOOTER.md', {},  function(err) {
      md.pipe(ws);
    })
  })
});


gulp.task('html', function() {
  gulp.src('src/index.html')
  .pipe(replace(replacements))
  .pipe(gulp.dest('./public'));
  
  gulp.src('src/socket.io.js')
  .pipe(gulp.dest('./public/socket.io'));

  gulp.src(files.html)
  /* .pipe(minifyHtml({ */
  /*   empty: true, */
  /*   spare: true, */
  /*   quotes: true */
  /* })) */
  .pipe(ngHtml2Js({
    moduleName: 'html'
  }))
  .pipe(concat('html.min.js'))
  .pipe(uglify())
  .pipe(replace(replacements))
  .pipe(gulp.dest('./public'))
});

gulp.task('src', ['html', 'images'], function() {

  if (bootMode == 'normal') {
    files.src.push('boot/prod/boot.js');
  } else {
    files.src.push('boot/dev/boot.js');
  }

  gulp.src(files.src)
  .pipe(replace(replacements))
  .pipe(concat('src.js'))
  .pipe(gulp.dest('./public'))
});

gulp.task('watch', function(){
  startServer();
  startLiveReload();
  gulp.watch(['src/**', 'src/**/**'], notifyLivereload);
});

var tasks = ['clean', 'footer', ['styles', 'libs', 'src', 'fonts', 'favicon', 'skins', 'tinymcefonts']];

gulp.task('default', function(cb){
  gulpSequence('clean', 'footer', ['styles', 'libs', 'src', 'fonts', 'favicon', 'skins', 'tinymcefonts'], cb);
});
