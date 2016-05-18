import { MODIFIERS } from 'mobiledoc-kit/utils/key';
import Keycodes from 'mobiledoc-kit/utils/keycodes';
import Browser from 'mobiledoc-kit/utils/browser';
import Helpers from '../test-helpers';
import Range from 'mobiledoc-kit/utils/cursor/range';

const { module, test } = Helpers;

let editor, editorElement;

// In Firefox, if the window isn't active (which can happen when running tests
// at SauceLabs), the editor element won't have the selection. This helper method
// ensures that it has a cursor selection.
// See https://github.com/bustlelabs/mobiledoc-kit/issues/388
function renderIntoAndFocusTail(treeFn, options={}) {
  let editor = Helpers.mobiledoc.renderInto(editorElement, treeFn, options);
  editor.selectRange(new Range(editor.post.tailPosition()));
  return editor;
}

module('Acceptance: Editor: Key Commands', {
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

function testStatefulCommand({modifierName, key, command, markupName}) {
  test(`${command} applies markup ${markupName} to highlighted text`, (assert) => {
    assert.expect(3);
    let done = assert.async();

    let modifier = MODIFIERS[modifierName];
    let modifierKeyCode = Keycodes[modifierName];
    let initialText = 'something';
    editor = renderIntoAndFocusTail(({post, markupSection, marker}) => post([
      markupSection('p', [marker(initialText)])
    ]));

    assert.ok(editor.hasCursor(), 'precond - editor should have cursor');

    assert.hasNoElement(`#editor ${markupName}`, `precond - no ${markupName} text`);
    Helpers.dom.selectText(editor ,initialText, editorElement);
    Helpers.dom.triggerKeyCommand(editor, key, modifier);
    Helpers.dom.triggerKeyEvent(editor, 'keyup', {charCode: 0, keyCode: modifierKeyCode});

    setTimeout(() => {
      assert.hasElement(`#editor ${markupName}:contains(${initialText})`,
                        `text wrapped in ${markupName}`);
      done();
    });
  });

  test(`${command} toggles ${markupName} for next entered text`, (assert) => {
    let done = assert.async();
    assert.expect(8);

    let modifier = MODIFIERS[modifierName];
    let modifierKeyCode = Keycodes[modifierName];
    let initialText = 'something';

    editor =renderIntoAndFocusTail(({post, markupSection, marker}) => post([
      markupSection('p', [marker(initialText)])
    ]));

    assert.ok(editor.hasCursor(), 'has cursor');

    assert.hasNoElement(`#editor ${markupName}`, `precond - no ${markupName} text`);
    Helpers.dom.moveCursorTo(editor,
      editor.post.sections.head.markers.head.renderNode.element,
      initialText.length);
    Helpers.dom.triggerKeyCommand(editor, key, modifier);
    // simulate meta/ctrl keyup
    Helpers.dom.triggerKeyEvent(editor, 'keyup', { charCode: 0, keyCode:  modifierKeyCode});

    setTimeout(() => {
      Helpers.dom.insertText(editor, 'z');

      let expected1 = Helpers.postAbstract.build(({post, markupSection, marker, markup}) => {
        return post([
          markupSection('p', [
            marker(initialText),
            marker('z', [markup(markupName)])
          ])
        ]);
      });
      let expected2 = Helpers.postAbstract.build(({post, markupSection, marker, markup}) => {
        return post([
          markupSection('p', [
            marker(initialText),
            marker('z', [markup(markupName)]),
            marker('x')
          ])
        ]);
      });

      assert.postIsSimilar(editor.post, expected1);
      assert.renderTreeIsEqual(editor._renderTree, expected1);
      assert.positionIsEqual(editor.range.head, editor.post.tailPosition());

      // un-toggles markup
      Helpers.dom.triggerKeyCommand(editor, key, modifier);
      Helpers.dom.triggerKeyEvent(editor, 'keyup', {charCode: 0, keyCode: modifierKeyCode});

      setTimeout(() => {
        Helpers.dom.insertText(editor, 'x');

        assert.postIsSimilar(editor.post, expected2);
        assert.renderTreeIsEqual(editor._renderTree, expected2);
        assert.positionIsEqual(editor.range.head, editor.post.tailPosition());

        done();
      });
    });
  });
}

testStatefulCommand({
  modifierName: 'META',
  key: 'B',
  command: 'command-B',
  markupName: 'strong'
});

testStatefulCommand({
  modifierName: 'CTRL',
  key: 'B',
  command: 'ctrl-B',
  markupName: 'strong'
});

testStatefulCommand({
  modifierName: 'META',
  key: 'I',
  command: 'command-I',
  markupName: 'em'
});

testStatefulCommand({
  modifierName: 'CTRL',
  key: 'I',
  command: 'ctrl-I',
  markupName: 'em'
});

test(`cmd-left goes to the beginning of a line (MacOS only)`, (assert) => {
  let initialText = 'something';
  editor = renderIntoAndFocusTail(({post, markupSection, marker}) => post([
    markupSection('p', [marker(initialText)])
  ]));

  assert.ok(editor.hasCursor(), 'has cursor');

  let textElement = editor.post.sections.head.markers.head.renderNode.element;

  Helpers.dom.moveCursorTo(editor, textElement, 4);
  let originalCursorPosition = Helpers.dom.getCursorPosition();
  Helpers.dom.triggerKeyCommand(editor, 'LEFT', MODIFIERS.META);

  let changedCursorPosition = Helpers.dom.getCursorPosition();
  let expectedCursorPosition = 0; // beginning of text

  if (Browser.isMac) {
    assert.equal(changedCursorPosition.offset, expectedCursorPosition, 'cursor moved to the beginning of the line on MacOS');
  } else {
    assert.equal(changedCursorPosition.offset, originalCursorPosition.offset, 'cursor not moved to the end of the line (non-MacOS)');
  }
});

test(`cmd-right goes to the end of a line (MacOS only)`, (assert) => {
  let initialText = 'something';
  editor = renderIntoAndFocusTail(({post, markupSection, marker}) => post([
    markupSection('p', [marker(initialText)])
  ]));

  assert.ok(editor.hasCursor(), 'has cursor');

  let textElement = editor.post.sections.head.markers.head.renderNode.element;

  Helpers.dom.moveCursorTo(editor, textElement, 4);
  let originalCursorPosition = Helpers.dom.getCursorPosition();
  Helpers.dom.triggerKeyCommand(editor, 'RIGHT', MODIFIERS.META);

  let changedCursorPosition = Helpers.dom.getCursorPosition();
  let expectedCursorPosition = initialText.length; // end of text

  if (Browser.isMac) {
    assert.equal(changedCursorPosition.offset, expectedCursorPosition, 'cursor moved to the end of the line on MacOS');
  } else {
    assert.equal(changedCursorPosition.offset, originalCursorPosition.offset, 'cursor not moved to the end of the line (non-MacOS)');
  }
});

test(`cmd-shif-left select text to the beginning of a line (MacOS only)`, (assert) => {
  let initialText = 'something';
  editor = renderIntoAndFocusTail(({post, markupSection, marker}) => post([
    markupSection('p', [marker(initialText)])
  ]));

  assert.ok(editor.hasCursor(), 'has cursor');

  let textElement = editor.post.sections.head.markers.head.renderNode.element;

  Helpers.dom.moveCursorTo(editor, textElement, 4);
  let originalCursorPosition = Helpers.dom.getCursorPosition();

  Helpers.dom.triggerKeyCommand(editor, 'LEFT', [MODIFIERS.META, MODIFIERS.SHIFT]);

  let changedCursorPosition = Helpers.dom.getCursorPosition();

  if (Browser.isMac) {
    assert.positionIsEqual(editor.range.head, editor.post.headPosition());
    assert.equal(editor.range.tail.offset, originalCursorPosition.offset);

  } else {
    assert.equal(changedCursorPosition.offset, originalCursorPosition.offset, 'cursor not moved to the end of the line (non-MacOS)');
  }
});

test(`cmd-shif-right select text to the end of a line (MacOS only)`, (assert) => {
  let initialText = 'something';
  editor = renderIntoAndFocusTail(({post, markupSection, marker}) => post([
    markupSection('p', [marker(initialText)])
  ]));

  assert.ok(editor.hasCursor(), 'has cursor');

  let textElement = editor.post.sections.head.markers.head.renderNode.element;

  Helpers.dom.moveCursorTo(editor, textElement, 4);
  let originalCursorPosition = Helpers.dom.getCursorPosition();

  Helpers.dom.triggerKeyCommand(editor, 'RIGHT', [MODIFIERS.META, MODIFIERS.SHIFT]);

  let changedCursorPosition = Helpers.dom.getCursorPosition();

  if (Browser.isMac) {
    assert.positionIsEqual(editor.range.head.offset, originalCursorPosition.offset);
    assert.positionIsEqual(editor.range.tail, editor.post.tailPosition());

  } else {
    assert.equal(changedCursorPosition.offset, initialText.length, 'cursor not moved to the end of the line (non-MacOS)');
  }
});
test(`ctrl-k clears to the end of a line`, (assert) => {
  let initialText = 'something';
  editor = renderIntoAndFocusTail(({post, markupSection, marker}) => post([
    markupSection('p', [marker(initialText)])
  ]));

  assert.ok(editor.hasCursor(), 'has cursor');

  let textElement = editor.post.sections.head.markers.head.renderNode.element;
  Helpers.dom.moveCursorTo(editor, textElement, 4);
  Helpers.dom.triggerKeyCommand(editor, 'K', MODIFIERS.CTRL);

  let changedMobiledoc = editor.serialize();
  let expectedMobiledoc = Helpers.mobiledoc.build(
    ({post, markupSection, marker}) => {
      return post([
        markupSection('p', [
          marker('some')
        ])
      ]);
  });
  assert.deepEqual(changedMobiledoc, expectedMobiledoc,
                   'mobiledoc updated appropriately');
});

test(`ctrl-k clears selected text`, (assert) => {
  let initialText = 'something';
  editor = renderIntoAndFocusTail( ({post, markupSection, marker}) => post([
    markupSection('p', [marker(initialText)])
  ]));

  assert.ok(editor.hasCursor(), 'has cursor');

  let textElement = editor.post.sections.head.markers.head.renderNode.element;
  Helpers.dom.moveCursorTo(editor, textElement, 4, textElement, 8);
  Helpers.dom.triggerKeyCommand(editor, 'K', MODIFIERS.CTRL);

  let changedMobiledoc = editor.serialize();
  let expectedMobiledoc = Helpers.mobiledoc.build(
    ({post, markupSection, marker}) => {
      return post([
        markupSection('p', [
          marker('someg')
        ])
      ]);
  });
  assert.deepEqual(changedMobiledoc, expectedMobiledoc,
                   'mobiledoc updated appropriately');
});

test('cmd-k links selected text', (assert) => {
  assert.expect(3);

  let url = 'http://bustle.com';
  editor = renderIntoAndFocusTail(({post, markupSection, marker}) => post([
    markupSection('p', [marker('something')])
  ]));

  assert.ok(editor.hasCursor(), 'has cursor');

  editor.showPrompt = (prompt, defaultUrl, callback) => {
    assert.ok(true, 'calls showPrompt');
    callback(url);
  };

  Helpers.dom.selectText(editor ,'something', editorElement);
  Helpers.dom.triggerKeyCommand(editor, 'K', MODIFIERS.META);

  assert.hasElement(`#editor a[href="${url}"]:contains(something)`);
});

test('cmd-k unlinks selected text if it was already linked', (assert) => {
  assert.expect(4);

  let url = 'http://bustle.com';
  editor = renderIntoAndFocusTail(({post, markupSection, marker, markup}) => post([
    markupSection('p', [marker('something', [markup('a', {href:url})])])
  ]));

  assert.ok(editor.hasCursor(), 'has cursor');

  editor.showPrompt = () => {
    assert.ok(false, 'should not call showPrompt');
  };
  assert.hasElement(`#editor a[href="${url}"]:contains(something)`,
                    'precond -- has link');

  Helpers.dom.selectText(editor ,'something', editorElement);
  Helpers.dom.triggerKeyCommand(editor, 'K', MODIFIERS.META);

  assert.hasNoElement(`#editor a[href="${url}"]:contains(something)`,
                     'removes linked text');
  assert.hasElement(`#editor p:contains(something)`, 'unlinked text remains');
});

test('new key commands can be registered', (assert) => {
  editor = renderIntoAndFocusTail(({post, markupSection, marker}) => post([
    markupSection('p', [marker('something')])
  ]));

  assert.ok(editor.hasCursor(), 'has cursor');

  let passedEditor;
  editor.registerKeyCommand({
    str: 'ctrl+x',
    run(editor) { passedEditor = editor; }
  });

  Helpers.dom.triggerKeyCommand(editor, 'Y', MODIFIERS.CTRL);

  assert.ok(!passedEditor, 'incorrect key combo does not trigger key command');

  Helpers.dom.triggerKeyCommand(editor, 'X', MODIFIERS.CTRL);

  assert.ok(!!passedEditor && passedEditor === editor, 'run method is called');
});

test('new key commands can be registered without modifiers', (assert) => {
  editor = renderIntoAndFocusTail(({post, markupSection, marker}) => post([
    markupSection('p', [marker('something')])
  ]));

  assert.ok(editor.hasCursor(), 'has cursor');

  let passedEditor;
  editor.registerKeyCommand({
    str: 'X',
    run(editor) { passedEditor = editor; }
  });

  Helpers.dom.triggerKeyCommand(editor, 'Y', MODIFIERS.CTRL);

  assert.ok(!passedEditor, 'incorrect key combo does not trigger key command');

  Helpers.dom.triggerKeyCommand(editor, 'X', MODIFIERS.CTRL);

  assert.ok(!passedEditor, 'key with modifier combo does not trigger key command');

  Helpers.dom.triggerKeyCommand(editor, 'X');

  assert.ok(!!passedEditor && passedEditor === editor, 'run method is called');
});

test('duplicate key commands can be registered with the last registered winning', (assert) => {
  editor = renderIntoAndFocusTail(({post, markupSection, marker}) => post([
    markupSection('p', [marker('something')])
  ]));

  assert.ok(editor.hasCursor(), 'has cursor');

  let firstCommandRan, secondCommandRan;

  editor.registerKeyCommand({
    str: 'ctrl+x',
    run() { firstCommandRan = true; }
  });
  editor.registerKeyCommand({
    str: 'ctrl+x',
    run() { secondCommandRan = true; }
  });

  Helpers.dom.triggerKeyCommand(editor, 'X', MODIFIERS.CTRL);

  assert.ok(!firstCommandRan, 'first registered method not called');
  assert.ok(!!secondCommandRan, 'last registered method is called');
});

test('returning false from key command causes next match to run', (assert) => {
  editor = renderIntoAndFocusTail(({post, markupSection, marker}) => post([
    markupSection('p', [marker('something')])
  ]));

  assert.ok(editor.hasCursor(), 'has cursor');

  let firstCommandRan, secondCommandRan;

  editor.registerKeyCommand({
    str: 'ctrl+x',
    run() { firstCommandRan = true; }
  });
  editor.registerKeyCommand({
    str: 'ctrl+x',
    run() {
      secondCommandRan = true;
      return false;
    }
  });

  Helpers.dom.triggerKeyCommand(editor, 'X', MODIFIERS.CTRL);

  assert.ok(!!secondCommandRan, 'last registered method is called');
  assert.ok(!!firstCommandRan, 'first registered method is called');
});

test('key commands can override built-in functionality', (assert) => {
  editor = renderIntoAndFocusTail(({post, markupSection, marker}) => post([
    markupSection('p', [marker('something')])
  ]));

  assert.ok(editor.hasCursor(), 'has cursor');

  let passedEditor;
  editor.registerKeyCommand({
    str: 'enter',
    run(editor) { passedEditor = editor; }
  });

  assert.equal($('#editor p').length, 1, 'has 1 paragraph to start');

  Helpers.dom.moveCursorTo(editor, editorElement.childNodes[0].childNodes[0], 5);
  Helpers.dom.triggerEnter(editor);

  assert.ok(!!passedEditor && passedEditor === editor, 'run method is called');

  assert.equal($('#editor p').length, 1, 'still has just one paragraph');
});

test('returning false from key command still runs built-in functionality', (assert) => {
  editor = renderIntoAndFocusTail(({post, markupSection, marker}) => post([
    markupSection('p', [marker('something')])
  ]));

  assert.ok(editor.hasCursor(), 'has cursor');

  let passedEditor;
  editor.registerKeyCommand({
    str: 'enter',
    run(editor) {
      passedEditor = editor;
      return false;
    }
  });

  assert.equal($('#editor p').length, 1, 'has 1 paragraph to start');

  Helpers.dom.moveCursorTo(editor, editorElement.childNodes[0].childNodes[0], 5);
  Helpers.dom.triggerEnter(editor);

  assert.ok(!!passedEditor && passedEditor === editor, 'run method is called');

  assert.equal($('#editor p').length, 2, 'has added a new paragraph');
});
