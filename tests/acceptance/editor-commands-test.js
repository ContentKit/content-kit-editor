import { Editor } from 'content-kit-editor';
import Helpers from '../test-helpers';
import { MOBILEDOC_VERSION } from 'content-kit-editor/renderers/mobiledoc';

const { test, module } = QUnit;

let fixture, editor, editorElement, selectedText;

const mobiledoc = {
  version: MOBILEDOC_VERSION,
  sections: [
    [],
    [[
      1, 'P', [[[], 0, 'THIS IS A TEST']],
      1, 'P', [[[], 0, 'second section']]
    ]]
  ]
};

module('Acceptance: Editor commands', {
  beforeEach() {
    fixture = document.getElementById('qunit-fixture');
    editorElement = document.createElement('div');
    editorElement.setAttribute('id', 'editor');
    fixture.appendChild(editorElement);
    editor = new Editor(editorElement, {mobiledoc});

    selectedText = 'IS A';
    Helpers.dom.selectText(selectedText, editorElement);
    Helpers.dom.triggerEvent(document, 'mouseup');
  },

  afterEach() {
    editor.destroy();
  }
});

test('when text is highlighted, shows toolbar', (assert) => {
  let done = assert.async();

  setTimeout(() => {
    assert.hasElement('.ck-toolbar', 'displays toolbar');
    assert.hasElement('.ck-toolbar-btn', 'displays toolbar buttons');
    let boldBtnSelector = '.ck-toolbar-btn[title="bold"]';
    assert.hasElement(boldBtnSelector, 'has bold button');

    done();
  });
});

test('highlight text, click "bold" button bolds text', (assert) => {
  let done = assert.async();

  setTimeout(() => {
    Helpers.toolbar.clickButton(assert, 'bold');
    assert.hasElement('#editor strong:contains(IS A)');

    done();
  });
});

test('highlight text, click "heading" button turns text into h2 header', (assert) => {
  const done = assert.async();

  setTimeout(() => {
    Helpers.toolbar.clickButton(assert, 'heading');
    assert.hasElement('#editor h2:contains(THIS IS A TEST)');
    assert.selectedText('THIS IS A TEST', 'expands selection to entire section');

    done();
  });
});

test('highlighting heading text activates toolbar button', (assert) => {
  const done = assert.async();

  setTimeout(() => {
    Helpers.toolbar.assertVisible(assert);
    Helpers.toolbar.assertInactiveButton(assert, 'heading');

    Helpers.toolbar.clickButton(assert, 'heading');

    Helpers.toolbar.assertActiveButton(assert, 'heading');

    // FIXME must actually trigger the mouseup
    Helpers.dom.clearSelection();
    Helpers.dom.triggerEvent(document, 'mouseup');

    setTimeout(() => {
      Helpers.toolbar.assertHidden(assert);

      Helpers.dom.selectText(selectedText, editorElement);
      Helpers.dom.triggerEvent(document, 'mouseup');

      setTimeout(() => {
        Helpers.toolbar.assertActiveButton(assert, 'heading',
                                  'heading button is active when text is selected');

        done();
      });
    });
  });
});

test('when heading text is highlighted, clicking heading button turns it to plain text', (assert) => {
  const done = assert.async();

  setTimeout(() => {
    Helpers.toolbar.clickButton(assert, 'heading');
    assert.hasElement('#editor h2:contains(THIS IS A TEST)');

    setTimeout(() => {
      Helpers.toolbar.clickButton(assert, 'heading');

      setTimeout(() => {
        assert.hasNoElement('#editor h2:contains(THIS IS A TEST)');
        assert.hasElement('#editor p:contains(THIS IS A TEST)');

        done();
      });
    });
  });
});

test('clicking multiple heading buttons keeps the correct ones active', (assert) => {
  const done = assert.async();

  setTimeout(() => {
    // click subheading, makes its button active, changes the display
    Helpers.toolbar.clickButton(assert, 'subheading');
    assert.hasElement('#editor h3:contains(THIS IS A TEST)');
    Helpers.toolbar.assertActiveButton(assert, 'subheading');
    Helpers.toolbar.assertInactiveButton(assert, 'heading');

    // click heading, makes its button active and no others, changes display
    Helpers.toolbar.clickButton(assert, 'heading');
    assert.hasElement('#editor h2:contains(THIS IS A TEST)');
    Helpers.toolbar.assertActiveButton(assert, 'heading');
    Helpers.toolbar.assertInactiveButton(assert, 'subheading');

    // click heading again, removes headline from display, no active buttons
    Helpers.toolbar.clickButton(assert, 'heading');
    assert.hasElement('#editor p:contains(THIS IS A TEST)');
    Helpers.toolbar.assertInactiveButton(assert, 'heading');
    Helpers.toolbar.assertInactiveButton(assert, 'subheading');

    done();
  });
});

test('highlight text, click "subheading" button turns text into h3 header', (assert) => {
  const done = assert.async();

  setTimeout(() => {
    Helpers.toolbar.clickButton(assert, 'subheading');
    assert.hasElement('#editor h3:contains(THIS IS A TEST)');

    done();
  });
});

test('highlight text, click "quote" button turns text into blockquote', (assert) => {
  const done = assert.async();

  setTimeout(() => {
    Helpers.toolbar.clickButton(assert, 'quote');
    assert.hasElement('#editor blockquote:contains(THIS IS A TEST)');

    done();
  });
});

// FIXME PhantomJS doesn't create keyboard events properly (they have no keyCode or which)
// see https://bugs.webkit.org/show_bug.cgi?id=36423
Helpers.skipInPhantom('highlight text, click "link" button shows input for URL, makes link', (assert) => {
  const done = assert.async();

  setTimeout(() => {
    Helpers.toolbar.clickButton(assert, 'link');
    let input = assert.hasElement('.ck-toolbar-prompt input');
    let url = 'http://google.com';
    $(input).val(url);
    Helpers.dom.triggerKeyEvent(input[0], 'keyup');

    assert.hasElement(`#editor a[href="${url}"]:contains(${selectedText})`);

    done();
  });
});

test('highlighting bold text shows bold button as active', (assert) => {
  const done = assert.async();

  setTimeout(() => {
    Helpers.toolbar.assertInactiveButton(assert, 'bold', 'precond - bold button is not active');
    Helpers.toolbar.clickButton(assert, 'bold');
    Helpers.toolbar.assertActiveButton(assert, 'bold');

    Helpers.dom.clearSelection();
    Helpers.dom.triggerEvent(document, 'mouseup');

    setTimeout(() => {
      Helpers.toolbar.assertHidden(assert);

      Helpers.dom.selectText(selectedText, editorElement);
      Helpers.dom.triggerEvent(document, 'mouseup');

      setTimeout(() => {
        Helpers.toolbar.assertVisible(assert);
        Helpers.toolbar.assertActiveButton(assert, 'bold');

        done();
      });
    });
  });
});

test('click bold button applies bold to selected text', (assert) => {
  const done = assert.async();

  setTimeout(() => {
    Helpers.toolbar.assertInactiveButton(assert, 'bold', 'precond - bold button is not active');
    Helpers.toolbar.clickButton(assert, 'bold');
    Helpers.toolbar.assertActiveButton(assert, 'bold');

    assert.hasNoElement('#editor strong:contains(THIS)');
    assert.hasNoElement('#editor strong:contains(TEST)');
    assert.hasElement('#editor strong:contains(IS A)');

    assert.selectedText(selectedText);

    Helpers.toolbar.clickButton(assert, 'bold');

    assert.hasNoElement('#editor strong:contains(IS A)', 'bold text is no longer bold');
    Helpers.toolbar.assertInactiveButton(assert, 'bold');

    done();
  });
});

test('can unbold part of a larger set of bold text', (assert) => {
  const done = assert.async();

  setTimeout(() => {
    Helpers.toolbar.assertInactiveButton(assert, 'bold', 'precond - bold button is not active');
    Helpers.toolbar.clickButton(assert, 'bold');
    Helpers.toolbar.assertActiveButton(assert, 'bold');

    assert.hasElement('#editor strong:contains(IS A)');

    Helpers.dom.selectText('S A', editorElement);
    Helpers.dom.triggerEvent(document, 'mouseup');

    setTimeout(() => {
      Helpers.toolbar.assertVisible(assert);
      Helpers.toolbar.assertActiveButton(assert, 'bold');
      Helpers.toolbar.clickButton(assert, 'bold');

      assert.hasElement('#editor strong:contains(I)', 'unselected text is bold');
      assert.hasNoElement('#editor strong:contains(IS A)', 'unselected text is bold');
      assert.hasElement('#editor p:contains(S A)', 'unselected text is bold');

      done();
    });
  });
});

test('can italicize text', (assert) => {
  const done = assert.async();

  setTimeout(() => {
    Helpers.toolbar.assertInactiveButton(assert, 'italic');
    Helpers.toolbar.clickButton(assert, 'italic');

    assert.hasElement('#editor em:contains(IS A)');
    assert.selectedText('IS A');
    Helpers.toolbar.assertActiveButton(assert, 'italic');

    Helpers.toolbar.clickButton(assert, 'italic');
    assert.hasNoElement('#editor em:contains(IS A)');
    Helpers.toolbar.assertInactiveButton(assert, 'italic');

    done();
  });
});

// test selecting across markers and boldening
// test selecting across markers in sections and bolding
