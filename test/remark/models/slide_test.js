var Slide = require('../../../src/remark/models/slide');

describe('Slide', function () {
  describe('properties', function () {
    it('should be extracted', function () {
      var slide = new Slide(1, 1, {
            content: [''],
            properties: {a: 'b', c: 'd'}
          });
      slide.properties.should.have.property('a', 'b');
      slide.properties.should.have.property('c', 'd');
      slide.content.should.eql(['']);
    });
  });

  describe('inheritance', function () {
    it('should inherit properties, content and notes', function () {
      var template = new Slide(1, 1, {
            content: ['Some content.'],
            properties: {prop1: 'val1'},
            notes: 'template notes'
          })
        , slide = new Slide(2, 2, {
            content: ['More content.'],
            properties: {prop2: 'val2'},
            notes: 'slide notes'
          }, template, {inheritPresenterNotes: true});

      slide.properties.should.have.property('prop1', 'val1');
      slide.properties.should.have.property('prop2', 'val2');
      slide.content.should.eql(['Some content.', 'More content.']);
      slide.notes.should.equal('template notes\n\nslide notes');
    });

    it('should not inherit notes when inheritPresenterNotes option is undefined', () => {
      var template = new Slide(1, 1, {
            content: [''],
            properties: {},
            notes: 'template notes'
          })
        , slide = new Slide(2, 2, {
            content: [''],
            properties: {},
            notes: 'just slide notes'
          }, template, {});

      slide.notes.should.equal('just slide notes');
    });

    it('should not inherit name property', function () {
      var template = new Slide(1, 1, {
            content: ['Some content.'],
            properties: {name: 'name'}
          })
        , slide = new Slide(1, 1, {content: ['More content.']}, template);

      slide.properties.should.not.have.property('name');
    });

    it('should not inherit layout property', function () {
      var template = new Slide(1, 1, {
            content: ['Some content.'],
            properties: {layout: true}
          })
        , slide = new Slide(1, 1, {content: ['More content.']}, template);

      slide.properties.should.not.have.property('layout');
    });

    it('should aggregate class property value', function () {
      var template = new Slide(1, 1, {
            content: ['Some content.'],
            properties: {'class': 'a'}
          })
        , slide = new Slide(1, 1, {
            content: ['More content.'],
            properties: {'class': 'b'}
          }, template);

      slide.properties.should.have.property('class', 'a, b');
    });

    it('should not expand regular properties when inheriting template', function () {
      var template = new Slide(1, 1, {
            content: ['{{name}}'],
            properties: {name: 'a'}
          })
        , slide = new Slide(1, 1, {
            content: [''],
            properites: {name: 'b'}
          }, template);

      slide.content.should.eql(['{{name}}', '']);
    });

      it('should expand simple content correctly', function () {
          var template = new Slide(1, 1, {
              content: ['a{{content}}b'],
          })
              , slide = new Slide(1, 1, {
                  content: ['slide']
          }, template);

          slide.content.should.eql(['aslideb']);
      });

      it('should expand list content correctly', function () {
          var template = new Slide(1, 1, {
              content: ['a{{content}}b'],
          })
              , slide = new Slide(1, 1, {
              content: ['slide', 'slide']
          }, template);

          slide.content.should.eql(['a', 'slide', 'slide', 'b']);
      });

      it('should expand structured content correctly', function () {
          var template = new Slide(1, 1, {
              content: ['a{{content}}b'],
          })
              , slide = new Slide(1, 1, {
              content: [
                  { block: false, class: 'the-class', content: [ 'slide' ] }
              ],
          }, template);

          slide.content.should.eql(['a', { block: false, class: 'the-class', content: [ 'slide' ] }, 'b']);
      });
  });

  describe('variables', function () {
    it('should be expanded to matching properties', function () {
      var slide = new Slide(1, 1, {
        content: ['prop1 = {{ prop1 }}'],
        properties: {prop1: 'val1'}
      });

      slide.expandVariables();

      slide.content.should.eql(['prop1 = val1']);
    });

    it('should ignore escaped variables', function () {
      var slide = new Slide(1, 1, {
        content: ['prop1 = \\{{ prop1 }}'],
        properties: {prop1: 'val1'}
      });

      slide.expandVariables();

      slide.content.should.eql(['prop1 = {{ prop1 }}']);
    });

    it('should ignore undefined variables', function () {
      var slide = new Slide(1, 1, {content: ['prop1 = {{ prop1 }}']});

      slide.expandVariables();

      slide.content.should.eql(['prop1 = {{ prop1 }}']);
    });
  });
});
