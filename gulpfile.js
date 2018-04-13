var gulp = require('gulp');
var less = require('gulp-less');
var rename = require('gulp-rename');
var postcss = require('gulp-postcss');
var cssnano = require('gulp-cssnano');
var header = require('gulp-header');
var modifyCssUrls = require('gulp-modify-css-urls');
var autoprefixer = require('autoprefixer');
var pkg = require('./package.json');

gulp.task('watch', function() {
  gulp.watch('src/**', ['build:style']);
});
gulp.task('build:iconfont', function() {
  gulp
    .src(['src/style/libs/iconfont/iconfont**'], { base: 'src/style/libs/' })
    .pipe(gulp.dest('dist/images'));
  gulp
    .src(['src/style/libs/iconfont/iconfont.css'])
    .pipe(
      rename(function(path) {
        path.extname = '.wxss';
      }))
    .pipe(gulp.dest('src/style/libs/iconfont/'))
})
gulp.task('build:style', function() {
  var banner = [
    '/*!',
    ' * PinGou v<%= pkg.version %> (<%= pkg.homepage %>)',
    ' * Copyright <%= new Date().getFullYear() %> XiaoKu, Inc.',
    ' */',
    ''
  ].join('\n');
  gulp
    .src(['src/style/app.wxss'], { base: 'src/style' })
    .pipe(less())
    .pipe(modifyCssUrls({
      modify: function(url, filePath) {
        if (url.indexOf('iconfont.') != -1) {
          return 'images/iconfont/' + url;
        }
      }
    }))
    .pipe(postcss([autoprefixer(['iOS >= 8', 'Android >= 4.1'])]))
    // .pipe(
    //   cssnano({
    //     zindex: false,
    //     autoprefixer: false,
    //     discardComments: { removeAll: true }
    //   })
    // )
    .pipe(header(banner, { pkg: pkg }))
    .pipe(
      rename(function(path) {
        path.extname = '.wxss';
      })
    )
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['watch', 'build:style']);