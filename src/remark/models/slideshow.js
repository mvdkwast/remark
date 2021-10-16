var Navigation = require('./slideshow/navigation')
  , Events = require('./slideshow/events')
  , utils = require('../utils')
  , Slide = require('./slide')
  , Parser = require('../parser')
  , macros = require('../macros')
;

module.exports = Slideshow;

function Slideshow(events, dom, options, callback) {
  var self = this
    , slides = []
    , links = {}
  ;

  slides.byName = {};
  options = options || {};

  // Extend slideshow functionality
  Events.call(self, events);
  Navigation.call(self, events);

  self.loadFromString = loadFromString;
  self.loadFromUrl = loadFromUrl;
  self.update = update;
  self.getLinks = getLinks;
  self.getSlides = getSlides;
  self.getSlideCount = getSlideCount;
  self.getSlideByName = getSlideByName;
  self.getSlidesByNumber = getSlidesByNumber;

  self.togglePresenterMode = togglePresenterMode;
  self.toggleHelp = toggleHelp;
  self.toggleBlackout = toggleBlackout;
  self.toggleMirrored = toggleMirrored;
  self.toggleFullscreen = toggleFullscreen;
  self.createClone = createClone;

  self.resetTimer = resetTimer;

  self.getRatio = getOrDefault('ratio', '4:3');
  self.getHighlightStyle = getOrDefault('highlightStyle', 'default');
  self.getHighlightLines = getOrDefault('highlightLines', false);
  self.getHighlightSpans = getOrDefault('highlightSpans', false);
  self.getHighlightInlineCode = getOrDefault('highlightInlineCode', false);
  self.getHighlightLanguage = getOrDefault('highlightLanguage', '');
  self.getSlideNumberFormat = getOrDefault('slideNumberFormat', '%current% / %total%');
  self.getCloneTarget = getOrDefault('cloneTarget', '_blank');

  events.on('toggleBlackout', function (opts) {
    if (opts && opts.propagate === false) return;

    if (self.clone && !self.clone.closed) {
      self.clone.postMessage('toggleBlackout', '*');
    }

    if (window.opener) {
      window.opener.postMessage('toggleBlackout', '*');
    }
  });

  if (options.sourceUrl) {
    loadFromUrl(options.sourceUrl, callback);
  } else {
    loadFromString(options.source);
    if (typeof callback === 'function') {
      callback(self);
    }
  }

  function loadFromString(source) {
    source = source || '';

    slides = createSlides(source, options);
    expandVariables(slides);

    links = {};
    slides.forEach(function (slide) {
      for (var id in slide.links) {
        if (slide.links.hasOwnProperty(id)) {
          links[id] = slide.links[id];
        }
      }
    });

    events.emit('slidesChanged');
  }

  function loadFromUrl(url, callback) {
    options.source = options.source || '';

    const urls = typeof url === 'string' ? [url] : url;

    const promises = urls.map(u => {
      let mdUrl;
      let properties = {};

      if (typeof u === 'string') {
        mdUrl = u;
      } else {
        mdUrl = u.url;
        properties = u.properties || {};
      }

      return fetch(mdUrl).then(r => r.text().then(t => {
        if (properties) {
          t = Object.entries(properties).map(entry => `%${entry[0]}: ${entry[1]}\n`).join('') + t;
        }
        return Promise.resolve(t);
      }));
    });


    Promise.all(promises)
      .then(markdownFiles => {
        options.source += markdownFiles.join('\n---\n');
        loadFromString(options.source);
        if (typeof callback === 'function') {
          callback(self);
        }
      });
  }

  function update() {
    events.emit('resize');
  }

  function getLinks() {
    return links;
  }

  function getSlides() {
    return slides.map(function (slide) {
      return slide;
    });
  }

  function getSlideCount() {
    return slides.length;
  }

  function getSlideByName(name) {
    return slides.byName[name];
  }

  function getSlidesByNumber(number) {
    return slides.byNumber[number];
  }

  function togglePresenterMode() {
    events.emit('togglePresenterMode');
  }

  function toggleHelp() {
    events.emit('toggleHelp');
  }

  function toggleBlackout() {
    events.emit('toggleBlackout');
  }

  function toggleMirrored() {
    events.emit('toggleMirrored');
  }

  function toggleFullscreen() {
    events.emit('toggleFullscreen');
  }

  function createClone() {
    events.emit('createClone');
  }

  function resetTimer() {
    events.emit('resetTimer');
  }

  function getOrDefault(key, defaultValue) {
    return function () {
      if (options[key] === undefined) {
        return defaultValue;
      }

      return options[key];
    };
  }
}

function createSlides(slideshowSource, options) {
  var parser = new Parser()
    , parsedSlides = parser.parse(slideshowSource, macros, options)
    , slides = []
    , byName = {}
    , propertiesState = {}
    , layoutSlide
  ;

  slides.byName = {};
  slides.byNumber = {};

  var slideNumber = 0;
  parsedSlides.forEach(function (slide, i) {
    var template, slideViewModel;

    if (slide.properties.continued === 'true' && i > 0) {
      template = slides[slides.length - 1];
    } else if (byName[slide.properties.template]) {
      template = byName[slide.properties.template];
    } else if (slide.properties.layout === 'false') {
      layoutSlide = undefined;
    } else if (layoutSlide && slide.properties.layout !== 'true') {
      template = layoutSlide;
    }

    if (slide.properties.continued === 'true' &&
      options.countIncrementalSlides === false &&
      slide.properties.count === undefined) {
      slide.properties.count = 'false';
    }

    if (slide.properties) {
      Object.keys(slide.properties)
        .filter(k => k[0] === '%')
        .forEach(k => propertiesState[k.substr(1)] = slide.properties[k]);
    }

    Object.keys(propertiesState).forEach(k => {
      if (slide.properties[k] !== undefined) {
        slide.properties[k] += (slide.properties[k] === '' ? '' : ' ') + propertiesState[k];
      } else {
        slide.properties[k] = propertiesState[k];
      }
    });

    var slideClasses = (slide.properties['class'] || '').split(/,| /)
      , excludedClasses = options.excludedClasses || []
      , slideIsIncluded = slideClasses.filter(function (c) {
      return excludedClasses.indexOf(c) !== -1;
    }).length === 0;

    if (slideIsIncluded && slide.properties.layout !== 'true' && slide.properties.count !== 'false') {
      slideNumber++;
      slides.byNumber[slideNumber] = [];
    }

    if (options.includePresenterNotes !== undefined && !options.includePresenterNotes) {
      slide.notes = '';
    }

    slideViewModel = new Slide(slides.length, slideNumber, slide, template, options);

    if (slide.properties.name) {
      byName[slide.properties.name] = slideViewModel;
    }

    if (slide.properties.layout === 'true') {
      layoutSlide = slideViewModel;
    } else {
      if (slideIsIncluded) {
        slides.push(slideViewModel);
        if (slides.byNumber[slideNumber] !== undefined) {
          slides.byNumber[slideNumber].push(slideViewModel);
        }
      }
      if (slide.properties.name) {
        slides.byName[slide.properties.name] = slideViewModel;
      }
    }

  });

  return slides;
}

function expandVariables(slides) {
  slides.forEach(function (slide) {
    slide.expandVariables();
  });
}
