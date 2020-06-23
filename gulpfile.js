const {src, dest, task, series, watch, parallel} = require('gulp');
const rm = require('gulp-rm');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const sassGlob = require('gulp-sass-glob');
const autoprefixer = require('gulp-autoprefixer');
const gcmq = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const svgo = require('gulp-svgo');
const svgSprite = require('gulp-svg-sprite');
const pug = require('gulp-pug');

const {DIST_PATH, SRC_PATH, STYLES_LIBS, JS_LIBS} = require('./gulp.config');
sass.compiler = require('node-sass');

task('clean', () => {
    return src(`${DIST_PATH}/**/*`, {read: false}).pipe(rm());
});

task('compile:pug', () => {
    return src(`${SRC_PATH}/pages/*.pug`)
        .pipe(pug({
            pretty: true
        }))
        .pipe(dest(DIST_PATH))
        .pipe(reload({stream: true}));
});

task('styles', () => {
    return src([
        ...STYLES_LIBS,
        `${SRC_PATH}/styles/main.scss`
    ])
        .pipe(sourcemaps.init())
        .pipe(concat('main-min.scss'))
        .pipe(sassGlob())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            cascade: false
        }))
        // Плагин группировки медиазопросов не сочетается с плагином для sourcemaps
        // .pipe(gcmq())
        .pipe(cleanCSS())
        .pipe(sourcemaps.write())
        .pipe(dest(`${DIST_PATH}/assets/css`))
        .pipe(reload({stream: true}));
});

task('scripts', () => {
    return src([
        ...JS_LIBS,
        `${SRC_PATH}/assets/js/*.js`
    ])
        .pipe(sourcemaps.init())
        .pipe(concat('main-min.js'))
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(dest(`${DIST_PATH}/assets/js`));
});

task('icons', () => {
    return src(`${SRC_PATH}/assets/svg/*.svg`)
        .pipe(svgo({
            plugins: [
                {
                    removeAttrs: {
                        attrs: "(width|height|data.*)"
                    },

                }
            ]
        }))
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: "../symbol_sprite.html",
                    prefix: 'icon-%f',
                    namespaceIDPrefix: 'icon-%f'
                },

            },
            shape : {
                id : {
                    generator: 'icon-%s'
                },
                dimension: { // Dimension related options
                    maxWidth: 0,
                    maxHeight: 0,
                    attributes: {
                        'width': '50px'
                    }

                }

            },
            svg: { // General options for created SVG files
                xmlDeclaration: true, // Add XML declaration to SVG sprite
                doctypeDeclaration: true, // Add DOCTYPE declaration to SVG sprite
                namespaceIDs: true, // Add namespace token to all IDs in SVG shapes
                namespaceIDPrefix: '', // Add a prefix to the automatically generated namespaceIDs
                namespaceClassnames: true, // Add namespace token to all CSS class names in SVG shapes
                dimensionAttributes: true // Width and height attributes on the sprite
            },

        }))
        .pipe(dest(`${DIST_PATH}/assets/icons/`))
});

task('copy:img', () => {
    return src(`${SRC_PATH}/assets/img/**/*`)
        .pipe(dest(`${DIST_PATH}/assets/img/`))
        .pipe(reload({stream: true}));
});

task('copy:fonts', () => {
    return src(`${SRC_PATH}/assets/fonts/**/*`)
        .pipe(dest(`${DIST_PATH}/assets/fonts/`))
        .pipe(reload({stream: true}));
});

task('copy:js', () => {
    return src(`${SRC_PATH}/assets/js/libs/*.js`)
        .pipe(dest(`${DIST_PATH}/assets/js/libs`))
        .pipe(reload({stream: true}));
});

task('server', () => {
    browserSync.init({
        server: {
            baseDir: `./${DIST_PATH}`
        },
        open: true
    });
});

task('watch', () => {
    watch(`./${SRC_PATH}/styles/**/*.scss`, series('styles'));
    watch(`./${SRC_PATH}/pages/**/*.pug`, series('compile:pug'));
    watch(`./${SRC_PATH}/assets/js/*.js`, series('scripts'));
    watch(`./${SRC_PATH}/assets/svg/*.svg`, series('icons'));
    watch(`./${SRC_PATH}/assets/img/**/*`, series('copy:img'));
    watch(`./${SRC_PATH}/assets/fonts/**/*`, series('copy:fonts'));
    watch(`./${SRC_PATH}/assets/js/libs/*`, series('copy:js'));
});

task('default',
    series('clean',
        parallel('compile:pug', 'styles', 'scripts', 'icons', 'copy:img', 'copy:fonts', 'copy:js'),
        parallel('watch', 'server')
    )
);
