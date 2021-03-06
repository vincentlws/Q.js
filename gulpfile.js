var gulp = require('gulp')
  , uglify = require('gulp-uglify')
  , maxmin = require('maxmin')
  , map = require('map-stream')
  , webpack = require('gulp-webpack')
  , config = require('./webpack.config')
  , mochaPhantomJS = require('gulp-mocha-phantomjs');

function Size(name) {
  this._name = name;
  this._max = undefined;
  this._min = undefined;
}
Size.prototype.max = function () {
  var self = this;
  return map(function (file, cb) {
    self._max = file.contents;
    cb(null, file);
  });
};
Size.prototype.min = function (rename) {
  var self = this;
  return map(function (file, cb) {
    self._min = file.contents;
    rename &&
      (file.path = rename(file.path));
    cb(null, file);
  });
};
Size.prototype.print = function () {
  var self = this;
  setTimeout(function () {
    console.log(self._name, maxmin(self._max, self._min, true));
  }, 0);
}

var jqSize = new Size('Q.js')
  , zeSize = new Size('Q.zepto.js')
  , naSize = new Size('Q.native.js');


gulp.task('test', function () {
  gulp.src('test/*.html')
    .pipe(mochaPhantomJS());
});

gulp.task('report', function () {
  gulp.src('test/*.html')
    .pipe(mochaPhantomJS({
      'reporter': 'xunit',
      'output': 'tests/results/result.xml'
    }));
});

gulp.task('jquery', function (done) {
  gulp.src(['./src/Q.js'])
    .pipe(webpack(config.jquery))
    .pipe(jqSize.max())
    .pipe(gulp.dest('./dist'))
    .on('end', function () {
      done();
    });
});

gulp.task('jquery-min', ['jquery'], function (done) {
  gulp.src(['./dist/Q.js'])
    .pipe(uglify({
      preserveComments: 'some'
    }))
    .pipe(jqSize.min(function (path) {
      return path.replace(/\.js$/, '.min.js');
    }))
    .pipe(gulp.dest('./dist'))
    .on('end', function () {
      jqSize.print();
      done();
    });
});

gulp.task('zepto', function (done) {
  gulp.src(['./src/Q.zepto.js'])
    .pipe(webpack(config.zepto))
    .pipe(zeSize.max())
    .pipe(gulp.dest('./dist'))
    .on('end', function () {
      done();
    });
});

gulp.task('zepto-min', ['zepto'], function (done) {
  gulp.src(['./dist/Q.zepto.js'])
    .pipe(uglify({
      preserveComments: 'some'
    }))
    .pipe(zeSize.min(function (path) {
      return path.replace(/\.js$/, '.min.js');
    }))
    .pipe(gulp.dest('./dist'))
    .on('end', function () {
      zeSize.print();
      done();
    });
});

gulp.task('native', function (done) {
  gulp.src(['./src/Q.native.js'])
    .pipe(webpack(config['native']))
    .pipe(naSize.max())
    .pipe(gulp.dest('./dist'))
    .on('end', function () {
      done();
    });
});

gulp.task('native-min', ['native'], function (done) {
  gulp.src(['./dist/Q.native.js'])
    .pipe(uglify({
      preserveComments: 'some'
    }))
    .pipe(naSize.min(function (path) {
      return path.replace(/\.js$/, '.min.js');
    }))
    .pipe(gulp.dest('./dist'))
    .on('end', function () {
      naSize.print();
      done();
    });
});

gulp.task('default', ['jquery-min', 'zepto-min', 'native-min']);
