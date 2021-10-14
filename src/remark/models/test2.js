const Parser = require("../parser");
const macros = require("../macros");
const Slide = require("./slide");
// const Slide = require("./slideold");

function createSlides (slideshowSource, options) {
    var parser = new Parser()
        ,  parsedSlides = parser.parse(slideshowSource, macros, options)
        , slides = []
        , byName = {}
        , layoutSlide
    ;

    slides.byName = {};
    slides.byNumber = {};

    var slideNumber = 0;
    parsedSlides.forEach(function (slide, i) {
        var template, slideViewModel;

        if (slide.properties.continued === 'true' && i > 0) {
            template = slides[slides.length - 1];
        }
        else if (byName[slide.properties.template]) {
            template = byName[slide.properties.template];
        }
        else if (slide.properties.layout === 'false') {
            layoutSlide = undefined;
        }
        else if (layoutSlide && slide.properties.layout !== 'true') {
            template = layoutSlide;
        }

        if (slide.properties.continued === 'true' &&
            options.countIncrementalSlides === false &&
            slide.properties.count === undefined) {
            slide.properties.count = 'false';
        }

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

function expandVariables (slides) {
    slides.forEach(function (slide) {
        slide.expandVariables();
    });
}

function test() {
    const source = 'name: a\nlayout: true\n---\nname: b';
    const slides = createSlides(source, {});
    console.log(slides);
    expandVariables(slides);
    console.log(slides);
}

test()