var through = require('through2');
var gutil = require('gulp-util');

const PLUGIN_NAME = 'gulp-l10n';

var htmlparser = require("htmlparser2");
var crypto = require('crypto');
var glob = require('glob');
var fs = require('fs');
var gulpL10n = {};

gulpL10n.extractLocale = function(opt) {
  var options = opt = opt || {};
  //localize the contents of all of the following elements
  options.elements = opt.elements || ['title', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  //localize the contents of all of the following attributes
  options.attributes = opt.attributes || ['alt', 'title'];
  //localize the contents of all elements with the following attributes
  options.directives = opt.directives || ['localize'];
  options.algorithm = opt.algorithm || 'md5';
  options.hashLength = opt.hashLength || 8;
  options.nativeLocale = opt.nativeLocale || 'en';

  var locale = {};

  function addFile(file, enc, cb){
    // ignore empty files
   if (file.isNull()) {
     cb();
     return;
   }
   if (file.isStream()) {
     cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not (yet) supported'));
     return;
   }
   if (file.isBuffer()) {
     parser.write(file.contents);
   }
    cb();
  }

  var parser = new htmlparser.Parser(new htmlparser.DomHandler(function(error, dom){
    if(error) {
      throw new gutil.PluginError(PLUGIN_NAME, error);
    }
    else {
      var strings = [];

      //extract strings from options.elements and elements with options.directives
      var elements = filterElementsByTagNames(dom, options.elements);
      elements = elements.concat(filterElementsByAttributes(dom, options.directives));
      for(var i = 0; i < elements.length; i++) {
        strings.push(htmlparser.DomUtils.getInnerHTML(elements[i]));
      }

      //extract strings from options.attributes
      strings = strings.concat(extractStringsFromAttributes(dom, options.attributes));

      // strings are ordered alphabetically for human readability & better source control
      strings.sort();

      for(var i = 0; i < strings.length; i++){
        locale[hash(strings[i], options.algorithm, options.hashLength)] = strings[i];
      }
    }
  }, {
    normalizeWhitespace: true
  }));

  function createLocaleFile(cb){
    parser.done();
    if (Object.keys(locale).length === 0) {
      cb();
      return;
    }
    this.push(new gutil.File({
      cwd: "",
      base: "",
      path: options.nativeLocale + '.json',
      contents: new Buffer(JSON.stringify(locale, null, '  '))
    }));
    cb();
  }

  function filterElementsByTagNames(dom, tagsArray) {
    var checkTags = function(elem){
      if(htmlparser.DomUtils.isTag(elem)){
        return tagsArray.indexOf(elem.name) !== -1;
      }
    };
    return htmlparser.DomUtils.filter(checkTags, dom);
  }

  function filterElementsByAttributes(dom, attributesArray) {
    var checkAttrs = function(elem){
      if(elem.attribs) {
        for(var i = 0; i < attributesArray.length; i++){
          if (elem.attribs.hasOwnProperty(attributesArray[i])) {
            return true;
          }
        }
      }
      return false;
    };
    return htmlparser.DomUtils.filter(checkAttrs, dom);
  }

  function extractStringsFromAttributes(dom, attributesArray) {
    var strings = [];
    var elements = filterElementsByAttributes(dom, attributesArray);
    for (var i = 0; i < elements.length; i++){
      for (var j = 0; j < attributesArray.length; j++){
        if (elements[i].attribs.hasOwnProperty(attributesArray[j])) {
          strings.push(elements[i].attribs[attributesArray[j]]);
        }
      }
    }
    return strings;
  }

  function hash(str, algorithm, length) {
    return crypto.createHash(algorithm).update(str).digest('hex').slice(0, length);
  }

  return through.obj(addFile, createLocaleFile);
};

gulpL10n.localize = function(opt) {
  var options = opt = opt || {};

  //path of nativeLocale file
  if(!opt.hasOwnProperty('nativeLocale')){
    cb(new gutil.PluginError(PLUGIN_NAME, 'Please provide the path to the `nativeLocale`.'));
    return;
  }
  var nativeLocalePath = opt.nativeLocale;
  var nativeLocale = JSON.parse(String(fs.readFileSync(nativeLocalePath)));

  //glob of locales to use in localizing files
  if(!opt.hasOwnProperty('locales')){
    cb(new gutil.PluginError(PLUGIN_NAME, 'Please provide a `locales` glob string.'));
    return;
  }
  var localePaths = glob.sync(opt.locales);

  var locales = {};
  for (var i = 0; i < localePaths.length; i++){
    // don't add the native locale to the dictionary of locales
    if(localePaths[i] !== nativeLocalePath){
      var localeIdentifier = localePaths[i].split('/').pop().split('.').shift();
      locales[localeIdentifier] = JSON.parse(String(fs.readFileSync(localePaths[i])));
    }
  }

  // strings must be exactly between delimiters in this set to be localized
  // (this avoids unintentional localization of unrelated strings)
  var potentialDelimiters = [
    ['>', '<'],
    ['"', '"'],
    ['\'', '\'']
    ];

  function localizeFile(file, enc, cb){
    // ignore empty files
   if (file.isNull()) {
     cb();
     return;
   }
   if (file.isStream()) {
     cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not (yet) supported'));
     return;
   }
   if (file.isBuffer()) {
     for (localeIdentifier in locales) {
       // create clone of file for each locale
       var localizedFile = file.clone();

       // place files in the locale's subdirectory
       localizedFile.path = localizedFile.path.replace(localizedFile.base, localizedFile.base + localeIdentifier + '/');

       var contents = String(localizedFile.contents);

       for (hash in nativeLocale){
         for (var i = 0; i < potentialDelimiters.length; i++){
           var chunks = contents.split(
             potentialDelimiters[i][0] +
             nativeLocale[hash] +
             potentialDelimiters[i][1]);

           contents = chunks.join(
             potentialDelimiters[i][0] +
             locales[localeIdentifier][hash] +
             potentialDelimiters[i][1]);
         }
       }

       localizedFile.contents = new Buffer(contents);
       this.push(localizedFile);
     }
   }
    cb();
  }

  return through.obj(localizeFile);
};

gulpL10n.simulateTranslation = function(opt) {
  var options = opt = opt || {};
  //simulate localization to the following locales
  options.locales = opt.locales || ['de', 'es', 'fr'];
  options.dictionary = opt.dictionary || {
    'a': 'á',
    'e': 'é',
    'i': 'í',
    'o': 'ó',
    'u': 'ú'
  };
  var files = [];
  var regexs = {}
  //key is dictionary value, value is the search regex
  for(var entry in options.dictionary){
    //don't replace characters inside html tags (between `<` and `>`)
    regexs[options.dictionary[entry]] = new RegExp('(?![^<]*>)' + escapeRegExp(entry), 'g');
  }

  function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }

  function addFile(file, enc, cb){
    // ignore empty files
   if (file.isNull()) {
     cb();
     return;
   }
   if (file.isStream()) {
     cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not (yet) supported'));
     return;
   }
   if (file.isBuffer()) {
     files.push(file);
   }
    cb();
  }

  function createLocalizations(cb){
    if (files.length > 1) {
      cb(new gutil.PluginError(
        PLUGIN_NAME,
        'Please simulateTranslation() of one nativeLocale file at a time. Consider using gulp-foreach for more control.'
      ));
      return;
    }
    var translation = JSON.parse(files[0].contents);

    for(var hash in translation){
      for(var replacement in regexs){
        translation[hash] = translation[hash].replace(regexs[replacement], replacement);
      }
    }
    for(var i = 0; i < options.locales.length; i++){
      this.push(new gutil.File({
        cwd: "",
        base: "",
        path: options.locales[i] + '.json',
        contents: new Buffer(JSON.stringify(translation, null, '  '))
      }));
    }
    cb();
  }

  return through.obj(addFile, createLocalizations);
};

module.exports = gulpL10n;
