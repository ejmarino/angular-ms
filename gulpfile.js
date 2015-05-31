var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var rename = require('gulp-rename');
var del = require('del');
 
function prepareScripts() {
	return gulp.src(['bower_components/angular/angular.min.js','dist/angular-ms.min.js'])
    .pipe(gulp.dest('demo/libs'));
}

function prepareDemo() {
	return gulp.src('src/**/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(concat('angular-ms.js'))
    .pipe(gulp.dest('dist'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
}

gulp.task('default', ['build']);

gulp.task('build', ['prepare-demo','prepare-scripts']);

gulp.task('prepare-scripts', prepareScripts);

gulp.task('prepare-demo', ['prepare-scripts'] , prepareDemo);

