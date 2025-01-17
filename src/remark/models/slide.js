module.exports = Slide;

function Slide (slideIndex, slideNumber, slide, template, options) {
    var self = this;

    self.properties = slide.properties || {};
    self.links = slide.links || {};
    self.content = slide.content || [];
    self.notes = slide.notes || '';

    self.getSlideIndex = function () { return slideIndex; };
    self.getSlideNumber = function () { return slideNumber; };

    if (template) {
        inherit(self, template, options);
    }
}

function inherit (slide, template, options) {
    inheritProperties(slide, template);
    inheritContent(slide, template);
    inheritNotes(slide, template, options);
}

function inheritProperties (slide, template) {
    var property
        , value
    ;

    for (property in template.properties) {
        if (!template.properties.hasOwnProperty(property) ||
            ignoreProperty(property)) {
            continue;
        }

        value = [template.properties[property]];

        if (property === 'class' && slide.properties[property]) {
            value.push(slide.properties[property]);
        }

        if (property === 'class' || slide.properties[property] === undefined) {
            slide.properties[property] = value.join(', ');
        }
    }
}

function ignoreProperty (property) {
    return property === 'name' ||
        property === 'layout' ||
        property === 'count';
}

function inheritContent (slide, template) {
    var expandedVariables;

    slide.properties.content = slide.content.slice();
    deepCopyContent(slide, template.content);

    expandedVariables = slide.expandVariables(/* contentOnly: */ true);

    if (expandedVariables.content === undefined) {
        slide.content = slide.content.concat(slide.properties.content);
    }

    delete slide.properties.content;
}

function deepCopyContent(target, content) {
    var i;

    target.content = [];
    for (i = 0; i < content.length; ++i) {
        if (typeof content[i] === 'string') {
            target.content.push(content[i]);
        }
        else {
            target.content.push({
                block: content[i].block,
                class: content[i].class,
            });
            deepCopyContent(target.content[target.content.length-1], content[i].content);
        }
    }
}

function inheritNotes (slide, template, options) {
    if (template.notes && options.inheritPresenterNotes) {
        slide.notes = template.notes + '\n\n' + slide.notes;
    }
}

Slide.prototype.expandVariables = function (contentOnly, content, expandResult) {
    var properties = this.properties
        , i
    ;

    content = content !== undefined ? content : this.content;
    expandResult = expandResult || {};

    var expandedContent = [];

    for (i = 0; i < content.length; ++i) {
        if (typeof content[i] === 'string') {
            const pieces = [];

            let start = 0;
            const matches = content[i].matchAll(/(\\)?(\{\{([^\}\n]+)\}\})/g);

            // expand variables, push in-between text + expands to pieces
            for (const match of matches) {
                const leadingText = content[i].substr(start, match.index);
                if (leadingText !== '') {
                    pieces.push(leadingText);
                }

                const expansion = expand(...match);
                pieces.push(expansion);
                start = match.index + match[0].length;
            }

            const trailingText = content[i].substr(start);
            if (trailingText !== '') {
                pieces.push(trailingText);
            }
            compact(pieces);

            expandedContent.push(...pieces);
        }
        else {
            this.expandVariables(contentOnly, content[i].content, expandResult);
            expandedContent.push(content[i]);
        }
    }

    // replace original content
    content.splice(0, content.length, ...expandedContent);

    function expand (match, escaped, unescapedMatch, property) {
        var propertyName = property.trim()
            , propertyValue
        ;

        if (escaped) {
            return contentOnly ? match[0] : unescapedMatch;
        }

        if (contentOnly && propertyName !== 'content') {
            return match;
        }

        propertyValue = properties[propertyName];
        if (propertyValue instanceof Array && propertyValue.length === 1 && typeof propertyValue[0] === 'string') {
            propertyValue = propertyValue[0];
        }

        if (propertyValue !== undefined) {
            expandResult[propertyName] = propertyValue;
            return propertyValue;
        }

        return propertyName === 'content' ? '' : unescapedMatch;
    }

    function compact(pieces) {
        if (pieces.length === 0) {
            return [];
        }

        const compactedPieces = [pieces[0]];
        for (let i=1; i<pieces.length; ++i) {
            const p = pieces[i];
            if (typeof p === 'string' && typeof pieces[i-1] === 'string') {
                compactedPieces[compactedPieces.length - 1] += p;
            }
            else if (p instanceof Array) {
                compactedPieces.push(...p);
            }
            else {
                compactedPieces.push(p);
            }
        }

        pieces.splice(0, pieces.length, ...compactedPieces);
    }

    return expandResult;
};
