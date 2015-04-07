# gulp-l10n-toolkit

A plugin for localizing html.

Very heavily based on: https://github.com/bitjson/gulp-l10n/

Adds support for `nested: true` which generates a nested JSON locale similar to chrome locales.


## Nested JSON

`nested: false` (Default)

```json
{
  "8f7f4c1c": "About",
  "95a55af6": "Team page",
  "58270ff3": "Citizen Kane"
}
```


`nested: true`

```json
{
  "about (8f7f4c1c)": {
    "message": "About",
    "_hash": "8f7f4c1c",
    "_tags": [
      "index",
      "about-us",
      "public.404",
      "public.error",
      "team"
    ]
  },
  "team-page (95a55af6)": {
    "message": "Team page",
    "_hash": "95a55af6",
    "_tags": [
      "index",
      "about-us",
      "public.404",
      "public.error",
      "team"
    ]
  },
  "citizen-kane (58270ff3)": {
    "message": "Citizen Kane",
    "_hash": "58270ff3",
    "_tags": [
      "index"
    ]
  }
}
```

- Slugifies the key for better readibility.
- Adds the sites where the string occurs to an `_tags` array.


## extractLocale()

Parse and extract localizable strings from html. Passes on a single `LOCALE.json`, where LOCALE is the nativeLocale.

```js
var gulp = require('gulp');
var l10n = require('gulp-l10n-toolkit');

gulp.task('extract-locale', function () {
  return gulp.src('src/**/*.html')
    .pipe(l10n.extractLocale())
    .pipe(gulp.dest('locales'));
});
```

### options

```js
// defaults included below

.pipe(l10n.extractLocale({
    // localize the contents of all of the following attributes
    attributes: ['alt', 'title'],

    // localize the contents of all elements with the following attributes
    directives: ['localize'],

    // localize the contents of all of the following elements
    elements: ['title', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

    // algorithm to hash each string
    hashAlgorithm: 'md5',

    // length at which to trim each hash
    hashLength: 8,

    // by default, the locale is written to the stream as `en.json`
    nativeLocale: 'en',

    // NEW: Create Chrome-like nested JSON with metadata and tags
    nested: false
  }))
```

## localize()

Localizes files for each locale in `locales`. Localized files are nested in a subdirectory for each locale. The `nativeLocale` and `locales` options are required.

```js
var gulp = require('gulp');
var l10n = require('gulp-l10n-toolkit');

gulp.task('localize', function () {
  return gulp.src('src/**/*.html')
    .pipe(l10n.localize({
      nativeLocale: 'locales/en.json',
      locales: 'locales/*.json'
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['localize']);

```
### options

```js
.pipe(l10n.localize({
    // Required: glob of locales to use in localizing files
    locales: 'locales/*.json',

    // Required: path of nativeLocale file
    nativeLocale: 'locales/en.json'
  }))
```



## simulateTranslation()

This is a utility to quickly simulate translation of the native locale to a list of `locales`.

```js
var gulp = require('gulp');
var l10n = require('gulp-l10n-toolkit');

gulp.task('simulate-translations', function () {
  return gulp.src('locales/en.json')
    .pipe(l10n.simulateTranslation())
    .pipe(gulp.dest('locales'));
});
```

### options

```js
.pipe(l10n.simulateTranslation({
    // dictionary of strings and string replacements, e.g.:
    // before: 'This is <a href="/">a test</a> string.'
    // after:  'Thís ís <a href="/">á tést</a> stríng.'
    dictionary: {
      'a': 'á',
      'e': 'é',
      'i': 'í',
      'o': 'ó',
      'u': 'ú'
    },

    // create the following simulated locales
    // defaults to: `de.json`, `es.json`, `fr.json`
    locales: ['de', 'es', 'fr']
  }))
```
