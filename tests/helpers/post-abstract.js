import PostNodeBuilder from 'mobiledoc-kit/models/post-node-builder';

/*
 * usage:
 *  Helpers.postAbstract.build(({post, section, marker, markup}) =>
 *    post([
 *      section('P', [
 *        marker('some text', [markup('B')])
 *      ])
 *    })
 *  )
 */
function build(treeFn) {
  let builder = new PostNodeBuilder();

  const simpleBuilder = {
    post          : (...args) => builder.createPost(...args),
    markupSection : (...args) => builder.createMarkupSection(...args),
    markup        : (...args) => builder.createMarkup(...args),
    marker        : (...args) => builder.createMarker(...args),
    listSection   : (...args) => builder.createListSection(...args),
    listItem      : (...args) => builder.createListItem(...args),
    cardSection   : (...args) => builder.createCardSection(...args),
    imageSection  : (...args) => builder.createImageSection(...args),
    atom          : (...args) => builder.createAtom(...args)
  };

  return treeFn(simpleBuilder);
}

let cardRegex = /\[(.*)\]/;
let markupRegex = /\*/g;
let listStartRegex = /^\* /;
let cursorRegex = /<|>|\|/g;

function parsePositionOffsets(text) {
  let offsets = {};

  if (cardRegex.test(text)) {
    [['|','solo'],['<','start'],['>','end']].forEach(([char, type]) => {
      if (text.indexOf(char) !== -1) {
        offsets[type] = text.indexOf(char) === 0 ? 0 : 1;
      }
    });
  } else {
    if (listStartRegex.test(text)) {
      text = text.replace(listStartRegex, '');
    }
    text = text.replace(markupRegex,'');
    if (text.indexOf('|') !== -1) {
      offsets.solo = text.indexOf('|');
    } else if (text.indexOf('<') !== -1 || text.indexOf('>') !== -1) {
      let hasStart = text.indexOf('<') !== -1;
      let hasEnd = text.indexOf('>') !== -1;
      if (hasStart) {
        offsets.start = text.indexOf('<');
        text = text.replace(/</g,'');
      }
      if (hasEnd) {
        offsets.end = text.indexOf('>');
      }
    }
  }

  return offsets;
}

function parseTextIntoMarkers(text, builder) {
  text = text.replace(cursorRegex,'');
  let markers = [];

  if (text.indexOf('@') !== -1) {
    let atomIndex = text.indexOf('@');
    let atom = builder.atom('some-atom');
    let pieces = [text.slice(0, atomIndex), atom, text.slice(atomIndex+1)];
    pieces.forEach(piece => {
      if (piece === atom) {
        markers.push(piece);
      } else if (piece.length) {
        markers = markers.concat( parseTextIntoMarkers(piece, builder) );
      }
    });
  } else if (text.indexOf('*') === -1) {
    if (text.length) {
      markers.push(builder.marker(text));
    }
  } else {
    let markup = builder.markup('b');

    let startIndex = text.indexOf('*');
    let endIndex = text.indexOf('*', startIndex+1);
    if (endIndex === -1) { throw new Error('Malformed text: asterisks do not match'); }

    let pieces = [text.slice(0, startIndex),
                  text.slice(startIndex+1, endIndex),
                  text.slice(endIndex+1)];
    pieces.forEach((piece, index) => {
      let markups = index === 1 ? [markup] : [];
      if (piece.length) {
        markers.push(builder.marker(piece, markups));
      }
    });
  }

  return markers;
}

function parseSingleText(text, builder) {
  let section, positions = {};

  let offsets = parsePositionOffsets(text);

  if (cardRegex.test(text)) {
    section = builder.cardSection(cardRegex.exec(text)[1]);
  } else {
    let type = 'p';
    if (listStartRegex.test(text)) {
      text = text.replace(listStartRegex,'');
      type = 'ul';
    }

    let markers = parseTextIntoMarkers(text, builder);

    switch (type) {
      case 'p':
        section = builder.markupSection('p', markers);
        break;
      case 'ul':
        section = builder.listItem(markers);
        break;
    }
  }

  ['start','end','solo'].forEach(type => {
    if (offsets[type] !== undefined) {
      positions[type] = section.toPosition(offsets[type]);
    }
  });

  return { section, positions };
}

/**
 * Shorthand to create a mobiledoc simply.
 * Pass a string or an array of strings.
 * 
 * Returns { post, range }, a post built from the mobiledoc and a range.
 *
 * Use "|" to indicate the cursor position or "<" and ">" to indicate a range.
 * Use "[card-name]" to indicate a card
 * Use asterisks to indicate bold text: "abc *bold* def"
 * Use "@" to indicate an atom
 * Use "* " at the start of the string to indicate a list item ("ul")
 *
 * Examples:
 * buildFromText("abc") -> { post } with 1 markup section ("p") with text "abc"
 * buildFromText(["abc","def"]) -> { post } with 2 markups sections ("p") with texts "abc" and "def"
 * buildFromText("abc|def") -> { post, range } where range is collapsed at offset 3 (after the "c")
 * buildFromText(["abcdef","[some-card]","def"]) -> { post } with [MarkupSection, Card, MarkupSection] sections
 * buildFromText(["* item 1", "* item 2"]) -> { post } with a ListSection with 2 ListItems
 * buildFromText(["<abc", "def", "ghi>"]) -> { post, range } where range is the entire post (before the "a" to after the "i")
 */
function buildFromText(texts) {
  if (!Array.isArray(texts)) { texts = [texts]; }
  let positions = {};

  let post = build(builder => {
    let sections = [];
    let curList;
    texts.forEach((text, index) => {
      let { section, positions: _positions } = parseSingleText(text, builder);
      let lastText = index === texts.length - 1;

      if (curList) {
        if (section.isListItem) {
          curList.items.append(section);
        } else {
          sections.push(curList);
          sections.push(section);
          curList = null;
        }
      } else if (section.isListItem) {
        curList = builder.listSection('ul', [section]);
      } else {
        sections.push(section);
      }

      if (lastText && curList) {
        sections.push(curList);
      }

      if (_positions.start) { positions.start = _positions.start; }
      if (_positions.end) { positions.end = _positions.end; }
      if (_positions.solo) { positions.solo = _positions.solo; }
    });

    return builder.post(sections);
  });

  let range;
  if (positions.start) {
    if (!positions.end) { throw new Error(`startPos but no endPos ${texts.join('\n')}`); }
    range = positions.start.toRange(positions.end);
  } else if (positions.solo) {
    range = positions.solo.toRange();
  }

  return { post, range };
}


export default {
  build,
  buildFromText
};
