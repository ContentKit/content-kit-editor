import { Editor } from 'mobiledoc-kit';
import Helpers from '../test-helpers';
import { MOBILEDOC_VERSION } from 'mobiledoc-kit/renderers/mobiledoc/0-3';
import Range from 'mobiledoc-kit/utils/cursor/range';

const { test, module } = Helpers;

const simpleAtom = {
  name: 'simple-atom',
  type: 'dom',
  render({value}) {
    let element = document.createElement('span');
    element.setAttribute('id', 'simple-atom');
    element.appendChild(document.createTextNode(value));
    return element;
  }
};

let editor, editorElement;
const mobiledocWithAtom = {
  version: MOBILEDOC_VERSION,
  atoms: [
    ['simple-atom', 'Bob']
  ],
  cards: [],
  markups: [],
  sections: [
    [1, "P", [
      [0, [], 0, "text before atom"],
      [1, [], 0, 0],
      [0, [], 0, "text after atom"]
    ]]
  ]
};
let editorOptions = { atoms: [simpleAtom] };

module('Acceptance: Atoms', {
  beforeEach() {
    editorElement = $('#editor')[0];
  },

  afterEach() {
    if (editor) {
      editor.destroy();
      editor = null;
    }
  }
});

test('keystroke of character before starting atom inserts character', (assert) => {
  let done = assert.async();
  let expected;
  editor = Helpers.mobiledoc.renderInto(editorElement, ({post, atom, markupSection, marker}) => {
    expected = post([markupSection('p', [marker('A'), atom('simple-atom', 'first')])]);
    return post([markupSection('p', [atom('simple-atom', 'first')])]);
  }, editorOptions);

  editor.selectRange(new Range(editor.post.headPosition()));
  Helpers.dom.insertText(editor, 'A');

  setTimeout(() => {
    assert.postIsSimilar(editor.post, expected);
    assert.renderTreeIsEqual(editor._renderTree, expected);
    done();
  });
});

test('keystroke of character before mid-text atom inserts character', (assert) => {
  let done = assert.async();
  let expected;
  editor = Helpers.mobiledoc.renderInto(editorElement, ({post, atom, markupSection, marker}) => {
    expected = post([markupSection('p', [marker('ABC'), atom('simple-atom', 'first')])]);
    return post([markupSection('p', [marker('AB'), atom('simple-atom', 'first')])]);
  }, editorOptions);

  editor.selectRange(Range.create(editor.post.sections.head, 'AB'.length));
  Helpers.dom.insertText(editor, 'C');

  setTimeout(() => {
    assert.postIsSimilar(editor.post, expected);
    assert.renderTreeIsEqual(editor._renderTree, expected);
    done();
  });
});

test('keystroke of character after mid-text atom inserts character', (assert) => {
  let done = assert.async();
  let expected;
  editor = Helpers.mobiledoc.renderInto(editorElement, ({post, atom, markupSection, marker}) => {
    expected = post([markupSection('p', [atom('simple-atom', 'first'), marker('ABC')])]);
    return post([markupSection('p', [atom('simple-atom', 'first'), marker('BC')])]);
  }, editorOptions);

  editor.selectRange(Range.create(editor.post.sections.head, 1));
  Helpers.dom.insertText(editor, 'A');

  setTimeout(() => {
    assert.postIsSimilar(editor.post, expected);
    assert.renderTreeIsEqual(editor._renderTree, expected);
    done();
  });
});

test('keystroke of character after end-text atom inserts character', (assert) => {
  let done = assert.async();
  let expected;
  editor = Helpers.mobiledoc.renderInto(editorElement, ({post, atom, markupSection, marker}) => {
    expected = post([markupSection('p', [atom('simple-atom', 'first'), marker('A')])]);
    return post([markupSection('p', [atom('simple-atom', 'first')])]);
  }, editorOptions);

  editor.selectRange(Range.create(editor.post.sections.head, 1));
  Helpers.dom.insertText(editor, 'A');

  setTimeout(() => {
    assert.postIsSimilar(editor.post, expected);
    assert.renderTreeIsEqual(editor._renderTree, expected);
    done();
  });
});

test('keystroke of delete removes character after atom', (assert) => {
  editor = new Editor({mobiledoc: mobiledocWithAtom, atoms: [simpleAtom]});
  editor.render(editorElement);

  let pNode = $('#editor p')[0];
  Helpers.dom.moveCursorTo(pNode.lastChild, 1);
  Helpers.dom.triggerDelete(editor);

  assert.postIsSimilar(editor.post, Helpers.postAbstract.build(
    ({post, markupSection, atom, marker}) => {
      return post([markupSection('p', [
        marker('text before atom'),
        atom('simple-atom', 'Bob'),
        marker('ext after atom')
      ])]);
    }));
});

test('keystroke of delete removes atom', (assert) => {
  editor = new Editor({mobiledoc: mobiledocWithAtom, atoms: [simpleAtom]});
  editor.render(editorElement);

  let pNode = $('#editor p')[0];
  Helpers.dom.moveCursorTo(pNode.lastChild, 0);
  Helpers.dom.triggerDelete(editor);

  assert.postIsSimilar(editor.post, Helpers.postAbstract.build(
    ({post, markupSection, atom, marker}) => {
      return post([markupSection('p', [
        marker('text before atomtext after atom')
      ])]);
    }));
});

test('keystroke of forward delete removes atom', (assert) => {
  editor = new Editor({mobiledoc: mobiledocWithAtom, atoms: [simpleAtom]});
  editor.render(editorElement);

  let pNode = $('#editor p')[0];
  Helpers.dom.moveCursorTo(pNode.firstChild, 16);
  Helpers.dom.triggerForwardDelete(editor);

  assert.postIsSimilar(editor.post, Helpers.postAbstract.build(
    ({post, markupSection, atom, marker}) => {
      return post([markupSection('p', [
        marker('text before atomtext after atom')
      ])]);
    }));
});

test('keystroke of enter in section with atom creates new section', (assert) => {
  editor = new Editor({mobiledoc: mobiledocWithAtom, atoms: [simpleAtom]});
  editor.render(editorElement);

  let pNode = $('#editor p')[0];
  Helpers.dom.moveCursorTo(pNode.lastChild, 1);
  Helpers.dom.triggerEnter(editor);

  assert.postIsSimilar(editor.post, Helpers.postAbstract.build(
    ({post, markupSection, atom, marker}) => {
      return post([
        markupSection('p', [
          marker('text before atom'),
          atom('simple-atom', 'Bob'),
          marker('t')
        ]),
        markupSection('p', [
          marker('ext after atom')
        ])
      ]);
    }));
});

test('keystroke of enter after atom and before marker creates new section', (assert) => {
  editor = new Editor({mobiledoc: mobiledocWithAtom, atoms: [simpleAtom]});
  editor.render(editorElement);

  let pNode = $('#editor p')[0];
  Helpers.dom.moveCursorTo(pNode.lastChild, 0);
  Helpers.dom.triggerEnter(editor);

  assert.postIsSimilar(editor.post, Helpers.postAbstract.build(
    ({post, markupSection, atom, marker}) => {
      return post([
        markupSection('p', [
          marker('text before atom'),
          atom('simple-atom', 'Bob')
        ]),
        markupSection('p', [
          marker('text after atom')
        ])
      ]);
    }));
});

test('keystroke of enter before atom and after marker creates new section', (assert) => {
  editor = new Editor({mobiledoc: mobiledocWithAtom, atoms: [simpleAtom]});
  editor.render(editorElement);

  let pNode = $('#editor p')[0];
  Helpers.dom.moveCursorTo(pNode.firstChild, 16);
  Helpers.dom.triggerEnter(editor);

  assert.postIsSimilar(editor.post, Helpers.postAbstract.build(
    ({post, markupSection, atom, marker}) => {
      return post([
        markupSection('p', [
          marker('text before atom')
        ]),
        markupSection('p', [
          atom('simple-atom', 'Bob'),
          marker('text after atom')
        ])
      ]);
    }));
});

test('marking atom with markup adds markup', (assert) => {
  editor = new Editor({mobiledoc: mobiledocWithAtom, atoms: [simpleAtom]});
  editor.render(editorElement);

  let pNode = $('#editor p')[0];
  Helpers.dom.selectRange(pNode.firstChild, 16, pNode.lastChild, 0);
  editor.run(postEditor => {
    let markup = editor.builder.createMarkup('strong');
    postEditor.addMarkupToRange(editor.range, markup);
  });

  assert.postIsSimilar(editor.post, Helpers.postAbstract.build(
    ({post, markupSection, atom, marker, markup}) => {
      return post([
        markupSection('p', [
          marker('text before atom'),
          atom('simple-atom', 'Bob', {}, [markup('strong')]),
          marker('text after atom')
        ])
      ]);
    }));
});

test('typing between two atoms inserts character', (assert) => {
  let done = assert.async();
  let expected;
  editor = Helpers.mobiledoc.renderInto(
    editorElement, ({post, markupSection, atom, marker}) => {
    expected = post([markupSection('p', [
      atom('simple-atom', 'first'),
      marker('A'),
      atom('simple-atom', 'last')
    ])]);
    return post([markupSection('p', [
      atom('simple-atom', 'first'),
      atom('simple-atom', 'last')
    ])]);
  }, editorOptions);

  editor.selectRange(Range.create(editor.post.sections.head, 1));

  Helpers.dom.insertText(editor, 'A');

  setTimeout(() => {
    assert.postIsSimilar(editor.post, expected);
    assert.renderTreeIsEqual(editor._renderTree, expected);
    done();
  });
});

test('delete selected text including atom deletes atom', (assert) => {
  let expected;
  editor = Helpers.mobiledoc.renderInto(editorElement, ({post, markupSection, marker, atom}) => {
    expected = post([markupSection('p', [marker('abc')])]);
    return post([markupSection('p', [
      marker('ab'), atom('simple-atom', 'deleteme'), marker('c')
    ])]);
  }, editorOptions);

  let section = editor.post.sections.head;
  editor.selectRange(Range.create(section, 'ab'.length,
                                  section, 'ab'.length + 1));

  Helpers.dom.triggerDelete(editor);

  assert.postIsSimilar(editor.post, expected);
  assert.renderTreeIsEqual(editor._renderTree, expected);
});

test('delete selected text that ends between atoms deletes first atom', (assert) => {
  let expected;
  editor = Helpers.mobiledoc.renderInto(editorElement, ({post, markupSection, marker, atom}) => {
    expected = post([markupSection('p', [
      marker('abd'),
      atom('simple-atom', 'keepme')
    ])]);
    return post([markupSection('p', [
      marker('ab'), atom('simple-atom', 'deleteme'),
      marker('cd'), atom('simple-atom', 'keepme')
    ])]);
  }, editorOptions);

  let section = editor.post.sections.head;
  editor.selectRange(Range.create(section, 'ab'.length,
                                  section, 'ab'.length + 1 + 'c'.length));

  Helpers.dom.triggerDelete(editor);

  assert.postIsSimilar(editor.post, expected);
  assert.renderTreeIsEqual(editor._renderTree, expected);
});
