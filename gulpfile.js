var gulp = require('gulp'),
    wiredep = require('wiredep').stream,
    useref = require('gulp-useref'),
    uglify = require('gulp-uglify'),
    cssnano = require('gulp-cssnano'),
    autoprefixer = require('gulp-autoprefixer'),
    runSequence = require('run-sequence'),
    htmlmin = require('gulp-htmlmin'),
    del = require('del'),
    imagemin = require('gulp-imagemin'),
    cache = require('gulp-cache'),
    browserSync = require('browser-sync').create(),
    rev = require('gulp-rev'),
    revReplace = require('gulp-rev-replace'),
    sass = require('gulp-sass'),
    babel = require('gulp-babel'),
    strip = require('gulp-strip-comments'),
    filter = require('gulp-filter'),
    plumber = require('gulp-plumber');



var app = './app';
var dist = 'dist';
var autoprefixerOptions = {
    browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
};

function reportError(err) {
    console.log(err.toString());
    this.emit('end');
}



////////MAIN TASK/////////
//build to production
gulp.task('build', function (callback) {
    runSequence('clean:dist', 'bower', 'sass', 'html', 'minifyMainHtml', 'minTemplates', 'fonts', 'images',
        callback
    )
});
//TASK FOR WORK
//At start
gulp.task('default', function (callback) {
    runSequence(['sass', 'bower', 'browserSync', 'watch'],
        callback
    )
});


//PARTICIALS

//Start Server
gulp.task('browserSync', function () {
    browserSync.init({
        server: {
            baseDir: app
        }
    })

});

//install all from bower.json -> dependencies to html
gulp.task('bower', function () {
    gulp.src(app + '/index.html')
        .pipe(wiredep({
            // optional: 'configuration',
            // goes: 'here'
        }))
        .pipe(gulp.dest(app));
});

//SASS to CSS with prefixes
gulp.task('sass', function () {

    return gulp.src(app + '/scss/main.scss')
        .pipe(plumber({errorHandler: reportError}))
        .pipe(sass())
        .pipe(autoprefixer(autoprefixerOptions))
        .pipe(gulp.dest(app + '/css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('script', function () {
    return gulp.src(app + '/js/**/*.js')
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('templates', function () {
    return gulp.src(app + '/**/*.html')
        .pipe(browserSync.reload({
            stream: true
        }))
});

//watcher
gulp.task('watch', function () {
    gulp.watch('bower.json', ['bower']);
    gulp.watch('./app/scss/**/*.scss', ['sass']);
    gulp.watch('./app/**/*.html', ['templates']);
    gulp.watch('./app/js/**/*.js', ['script']);
    // Other watchers can be added
});

//Production
gulp.task('clean:dist', function () {
    return del.sync(dist);
});

gulp.task('html', function () {
    var jsFilter = filter("**/*.js", {restore: true});
    var cssFilter = filter("**/*.css", {restore: true});
    var indexHtmlFilter = filter(['**/*', '!**/index.html'], {restore: true});
    return gulp.src(app + '/index.html')
        .pipe(useref())      // Concatenate with gulp-useref
        .pipe(jsFilter)
        .pipe(strip())
        .pipe((babel({
            presets: ['es2015']
        })))
        .pipe(uglify())// Minify any javascript sources
        .pipe(jsFilter.restore)
        .pipe(cssFilter)
        .pipe(cssnano())
        .pipe(autoprefixer(autoprefixerOptions))// Minify any CSS sources
        .pipe(cssFilter.restore)
        .pipe(indexHtmlFilter)
        .pipe(rev())                // Rename the concatenated files (but not index.html)
        .pipe(indexHtmlFilter.restore)
        .pipe(revReplace())
        // Substitute in new filenames
        .pipe(gulp.dest('dist'));
});

gulp.task('minifyMainHtml', function () {
    return gulp.src(dist + '/*.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(strip())
        .pipe(gulp.dest(dist))

});
gulp.task('minTemplates', function () {
    return gulp.src(app + '/views/**/*.html')
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(strip())
        .pipe(gulp.dest('dist/views'))
});


gulp.task('fonts', function () {
    return gulp.src(app + '/fonts/**/*')
        .pipe(gulp.dest(dist + '/fonts'))
});


gulp.task('images', function () {
    return gulp.src(app + '/i/**/*.+(png|jpg|jpeg|gif|svg)')
        .pipe(cache(imagemin({
            interlaced: true
        })))
        .pipe(gulp.dest(dist + '/i'))
});
