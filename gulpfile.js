var gulp = require('gulp');
var uglify = require('gulp-uglify');
var tslint = require('gulp-tslint');
var rename = require('gulp-rename');
var karma = require('gulp-karma');
var ts = require('gulp-typescript');
var merge = require('merge2');
var del = require('del');

function prepareDemo() {
    return gulp.src(['bower_components/angular/angular.js', 'dist/js/angular-ms.js'])
        .pipe(gulp.dest('demo/libs'));
}

function checkSyntax() {
    return gulp.src(['src/**/*.ts', 'test/**/*ts'])
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

function prepareTestScripts() {
    var tsResult = gulp.src(['test/*.ts'])
        .pipe(ts(
        {
            removeComments: true,
            noImplicitAny: true
        }
        ));
    return tsResult.js.pipe(gulp.dest('test/js'));
}

function test() {
    var testFiles = [
        'bower_components/angular/angular.js',
        'bower_components/angular-mocks/angular-mocks.js',
        'dist/js/angular-ms.js',
        'test/js/*Spec.js'
    ];

    // Be sure to return the stream 
    return gulp.src(testFiles)
        .pipe(karma({
        configFile: 'test/karma.conf.js',
        action: 'run'
    }));
    // .on('error', function(err) {
    // Make sure failed tests cause gulp to exit non-zero 
    //throw err;
    // });
}

gulp.task('prepare-test-scripts', ['prepare-scripts'], prepareTestScripts);

gulp.task('test', ['prepare-test-scripts'], test);

gulp.task('default', ['build']);

gulp.task('build', ['prepare-demo', 'prepare-scripts']);

gulp.task('prepare-scripts', ['checkSyntax'], prepareScripts);

gulp.task('checkSyntax', checkSyntax);

gulp.task('prepare-demo', ['prepare-scripts'], prepareDemo);

