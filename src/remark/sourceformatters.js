var sourceFormatters = module.exports = {};

// node is give so source node can be replaced (eg. with canvas)
sourceFormatters.hello = function (src, lang, node) {
  return 'hello from ' + lang;
};
