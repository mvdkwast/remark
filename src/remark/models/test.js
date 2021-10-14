const Slide = require("./slide");

function check(a, b, msg) {
    console.assert(JSON.stringify(a) === JSON.stringify(b), `${msg}\nexpected: ${JSON.stringify(a)}\ngot     : ${JSON.stringify(b)}`);
}

function should_not_expand_regular_properties_when_inheriting_template() {
    var template = new Slide(1, 1, {
        content: ['{{name}}'],
        properties: {name: 'a'}
    })
        , slide = new Slide(1, 1, {
        content: [''],
        properites: {name: 'b'}
    }, template);

    check(['{{name}}', ''], slide.content, 'should_not_expand_regular_properties_when_inheriting_template');
}

function simpleContent() {
    var template = new Slide(1, 1, {
        content: ['a{{content}}b'],
    })
        , slide = new Slide(1, 1, {
        content: ['slide']
    }, template);

    check(['aslideb'], slide.content, 'simpleContent');
}

function arrayContent() {
    const template = new Slide(1, 1, {
        content: ['a{{content}}b'],
    });

    const slide = new Slide(1, 1, {
        content: [
            'slide',
            'slide'
        ],
    }, template);

    check(['a', 'slide', 'slide', 'b'], slide.content, 'arrayContent');
}

function objectContent() {
    var template = new Slide(1, 1, {
        content: ['a{{content}}b'],
    })
        , slide = new Slide(1, 1, {
        content: [
            {block: false, class: 'the-class', content: ['slide']}
        ],
    }, template);

    check(['a', {block: false, class: 'the-class', content: ['slide']}, 'b'], slide.content, 'objectContent');
}

should_not_expand_regular_properties_when_inheriting_template();
simpleContent();
arrayContent();
objectContent();

