// include gulp
var gulp = require('gulp');

// include plug-ins
var jshint = require('gulp-jshint'),
	minifyHTML = require('gulp-minify-html'),
	babel = require('gulp-babel'),
	autoprefix = require('gulp-autoprefixer'),
	minifyCSS = require('gulp-minify-css'),
	del = require('del');


gulp.task('cleanjsbase', function() {
    return del(['./Public/live/js/']);
});

gulp.task('cleanjssw', function() {
    return del(['./Public/live/sw/']);
});

gulp.task('cleancss', function() {
    return del(['./Public/live/css/']);
});

gulp.task('cleanhtml', function() {
    return del(['./live/']);
});

// JS minify tasks
gulp.task('js-base', ['cleanjsbase'], function() {
  return gulp.src('./Public/dev/js/*.js')
    .pipe(jshint({esversion: 6, laxcomma: true}))
    .pipe(jshint.reporter('gulp-jshint-file-reporter', {
      filename: __dirname + '/jshint-output.log'
    }))
    .pipe(babel({presets: ['babili']}))
    .pipe(gulp.dest('./Public/live/js/'));

});

gulp.task('js-serviceworker', ['cleanjssw'], function() {
  return gulp.src('./Public/dev/sw/*.js')
    .pipe(jshint({esversion: 6, laxcomma: true}))
    .pipe(jshint.reporter('gulp-jshint-file-reporter', {
      filename: __dirname + '/jshint-output-sw.log'
    }))
    .pipe(babel({presets: ['babili']}))
    .pipe(gulp.dest('./Public/live/sw/'));
});

gulp.task('js-server', function() {
  return gulp.src('./modules/**/*')
    .pipe(jshint({esversion: 6, laxcomma: true}))
    .pipe(jshint.reporter('gulp-jshint-file-reporter', {
      filename: __dirname + '/jshint-output-server.log'
    }));
});

gulp.task('js', ['js-base', 'js-serviceworker', 'js-server'], () => {});

// CSS minify task
gulp.task('css', ['cleancss'], function() {
  return gulp.src('./Public/dev/css/*.css')
    .pipe(autoprefix())
    .pipe(minifyCSS())
    .pipe(gulp.dest('./Public/live/css/'));
});

// HTML minify task
gulp.task('html', ['cleanhtml'], function() {
  return gulp.src('./dev/*.html')
    .pipe(minifyHTML())
    .pipe(gulp.dest('./live/'));
});



// JS minify task
gulp.task('js_dev', function() {
  gulp.src('./Public/dev/js/*.js')
    .pipe(jshint({esversion: 6, laxcomma: true}))
    .pipe(jshint.reporter('gulp-jshint-file-reporter', {
      filename: __dirname + '/jshint-output.log'
    }))
    .pipe(gulp.dest('./Public/live/js/'));

  gulp.src('./Public/dev/sw/*.js')
    .pipe(jshint({esversion: 6, laxcomma: true}))
    .pipe(jshint.reporter('gulp-jshint-file-reporter', {
      filename: __dirname + '/jshint-output-sw.log'
    }))
    .pipe(gulp.dest('./Public/live/sw/'));

  gulp.src('./modules/**/*')
    .pipe(jshint({esversion: 6, laxcomma: true}))
    .pipe(jshint.reporter('gulp-jshint-file-reporter', {
      filename: __dirname + '/jshint-output-server.log'
    }))
});

// CSS minify task
gulp.task('css_dev', function() {
  gulp.src('./Public/dev/css/*.css')
    .pipe(autoprefix())
    .pipe(gulp.dest('./Public/live/css/'));
});


// HTML minify task
gulp.task('html_dev', function() {
  gulp.src('./dev/*.html')
    .pipe(gulp.dest('./live/'));
});

gulp.task('default', ['css', 'js', 'html'], function() {});

gulp.task('dev', ['css_dev', 'js_dev', 'html_dev'], function() {});

gulp.task('stable', ['default'], function() {
    var now = Date.now().toString().slice(3,10);

   gulp.src('./Public/dev/**/*')
    .pipe(gulp.dest('./Backup/' + now + '/Public/'));

   gulp.src('./dev/**/*')
    .pipe(gulp.dest('./Backup/' + now + '/dev/'));

    gulp.src('./*')
    .pipe(gulp.dest('./Backup/' + now + '/'));
});

gulp.task('watch', function() {

    // Watch .css files
    gulp.watch('./Public/dev/css/*.css', ['css']);

    // Watch .js files
    gulp.watch('./Public/dev/js/*.js', ['js']);
    gulp.watch('./Public/dev/sw/*.js', ['js']);
    gulp.watch('./modules/**/*', ['js']);

    // Watch html files
    gulp.watch('./Public/dev/*.html', ['html']);
});