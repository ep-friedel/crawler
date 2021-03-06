// include gulp
var gulp = require('gulp');

// include plug-ins
var jshint = require('gulp-jshint'),
	minifyHTML = require('gulp-minify-html'),
	babel = require('gulp-babel'),
	autoprefix = require('gulp-autoprefixer'),
	minifyCSS = require('gulp-minify-css'),
	del = require('del');


// JS minify task
gulp.task('js', function() {
  gulp.src('./Public/dev/js/*.js')
    .pipe(jshint({esversion: 6, laxcomma: true}))
    .pipe(jshint.reporter('gulp-jshint-file-reporter', {
      filename: __dirname + '/jshint-output.log'
    }))
    .pipe(babel({presets: ['babili']}))
    .pipe(gulp.dest('./Public/live/js/'));

  gulp.src('./Public/dev/sw/*.js')
    .pipe(jshint({esversion: 6, laxcomma: true}))
    .pipe(jshint.reporter('gulp-jshint-file-reporter', {
      filename: __dirname + '/jshint-output-sw.log'
    }))
    .pipe(babel({presets: ['babili']}))
    .pipe(gulp.dest('./Public/live/sw/'));

  gulp.src('./modules/**/*')
    .pipe(jshint({esversion: 6, laxcomma: true}))
    .pipe(jshint.reporter('gulp-jshint-file-reporter', {
      filename: __dirname + '/jshint-output-server.log'
    }))
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
gulp.task('css', function() {
  gulp.src('./Public/dev/css/*.css')
    .pipe(autoprefix())
    .pipe(minifyCSS())
    .pipe(gulp.dest('./Public/live/css/'));
});

// CSS minify task
gulp.task('css_dev', function() {
  gulp.src('./Public/dev/css/*.css')
  	.pipe(autoprefix())
    .pipe(gulp.dest('./Public/live/css/'));
});

// HTML minify task
gulp.task('html', function() {
  gulp.src('./dev/*.html')
    .pipe(minifyHTML())
    .pipe(gulp.dest('./live/'));
});

// HTML minify task
gulp.task('html_dev', function() {
  gulp.src('./dev/*.html')
    .pipe(gulp.dest('./live/'));
});

gulp.task('clean', function() {
    return del(['./Public/live/css/', './Public/live/js/', './live/']);
});

gulp.task('default', ['clean'], function() {
    gulp.start('css', 'js', 'html');
});

gulp.task('dev', ['clean'], function() {
    gulp.start('css_dev', 'js_dev', 'html_dev');
});

gulp.task('stable', function() {
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