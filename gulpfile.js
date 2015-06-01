var gulp = require('gulp');
var uglify = require('gulp-uglify');
var tslint = require('gulp-tslint');
var rename = require('gulp-rename');
var ts = require('gulp-typescript');
var merge = require('merge2');
var del = require('del');

function prepareDemo() {
    return gulp.src(['bower_components/angular/angular.js', 'dist/js/angular-ms.js'])
        .pipe(gulp.dest('demo/libs'));
}

function checkSyntax() {
        return gulp.src('src/**/*.ts')
        .pipe(tslint('tslint.json'))
        .pipe(tslint.report('prose'));
}

function prepareScripts() {
    var tsResult = gulp.src(['src/**/*.ts', 'typings/**/*.d.ts'])
        .pipe(ts(
          { 
            removeComments: true,
            declarationFiles: true,
            noExternalResolve: true,
            noImplicitAny: true,
            out: 'angular-ms.js'
          }
         ));

    return merge([
        tsResult.dts.pipe(gulp.dest('dist/definitions')),
        tsResult.js.pipe(gulp.dest('dist/js'))
                   .pipe(rename({ suffix: '.min' }))
                   .pipe(uglify())
                   .pipe(gulp.dest('dist/js'))
    ]);

}

gulp.task('default', ['build']);

gulp.task('build', ['prepare-demo', 'prepare-scripts']);

gulp.task('prepare-scripts', ['checkSyntax'], prepareScripts);

gulp.task('checkSyntax', checkSyntax);

gulp.task('prepare-demo', ['prepare-scripts'], prepareDemo);

