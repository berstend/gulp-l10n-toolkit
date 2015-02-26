[![Stories in Ready](https://badge.waffle.io/bitjson/gulp-l10n.png?label=ready&title=Ready)](https://waffle.io/bitjson/gulp-l10n)
# gulp-l10n

A plugin for localizing html.

## Methods

### extractLocale

Parse and extract localizable strings. Passes on a single `LOCALE.json`, where LOCALE is the nativeLocale.

```js
var gulp = require('gulp');
var l10n = require('gulp-l10n');

gulp.task('extract-locale', function () {
  return gulp.src('build/**/*.html')
    .pipe(l10n.extractLocale({
        nativeLocale: 'en' //`en` is default
      }))
    .pipe(gulp.dest('locales'));
});
```

#### options

```js
// defaults included below

.pipe(l10n.extractLocale({
    //localize the contents of all of the following elements
    elements: ['title', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

    //localize the contents of all of the following attributes
    attributes: ['alt', 'title'],

    //localize the contents of all elements with the following attributes
    directives: ['localize'],

    //algorithm to hash each string
    hashAlgorithm: 'md5',

    //length at which to trim
    hashLength: 8,

    //by default, the locale is written to the stream as `en.json`
    nativeLocale: 'en'
  }))
```

### Localize (WIP)

Localizes files for each locale in `locales`. Localized files are nested in a subdirectory for each locale.

```js
var gulp = require('gulp');
var l10n = require('gulp-l10n');

gulp.task('localize', function () {
  return gulp.src('build/**/*.html')
    .pipe(l10n.localize({
      locales: 'locales/*.json',
      nativeLocale: 'locales/en.json'
    }))
    .pipe(gulp.dest('build'));
});

gulp.task('default', ['localize']);

```

### simulateTranslation (WIP)

This is a utility to quickly simulate translation of the native locale to a list of `locales`.

```js
var gulp = require('gulp');
var l10n = require('gulp-l10n');

gulp.task('simulate-translations', function () {
  return gulp.src('locales/en.json')
    .pipe(l10n.simulateTranslation({
      locales: ['de', 'es', 'fr']
    }))
    .pipe(gulp.dest('locales'));
});
```
