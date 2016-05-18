import Key from '../utils/key';
import { MODIFIERS, SPECIAL_KEYS, DIRECTION } from '../utils/key';
import { filter, reduce } from '../utils/array-utils';
import assert from '../utils/assert';
import Range from '../utils/cursor/range';
import Browser from '../utils/browser';

function selectAll(editor) {
  let { post } = editor;
  let allRange = new Range(post.headPosition(), post.tailPosition());
  editor.selectRange(allRange);
}

function gotoStartOfLine(editor) {
  let {range} = editor;
  let {tail: {section}} = range;
  editor.run(postEditor => {
    postEditor.setRange(new Range(section.headPosition()));
  });
}

function gotoEndOfLine(editor) {
  let {range} = editor;
  let {tail: {section}} = range;
  editor.run(postEditor => {
    postEditor.setRange(new Range(section.tailPosition()));
  });
}

function selectLineToLeft(editor) {
  let {range} = editor;
  let {tail: {section}} = range;
  let selectionRange = new Range(section.headPosition(), range.tail);

  selectionRange.direction = DIRECTION.BACKWARD;
  editor.selectRange(selectionRange);
}

function selectLineToRight(editor) {
  let {range} = editor;
  let {tail: {section}} = range;
  let selectionRange = new Range(range.head, section.tailPosition());

  selectionRange.direction = DIRECTION.FORWARD;
  editor.selectRange(selectionRange);
}

export const DEFAULT_KEY_COMMANDS = [{
  str: 'META+B',
  run(editor) {
    editor.toggleMarkup('strong');
  }
}, {
  str: 'CTRL+B',
  run(editor) {
    editor.toggleMarkup('strong');
  }
}, {
  str: 'META+I',
  run(editor) {
    editor.toggleMarkup('em');
  }
}, {
  str: 'CTRL+I',
  run(editor) {
    editor.toggleMarkup('em');
  }
}, {
  str: 'CTRL+K',
  run(editor) {
    let { range } = editor;
    if (range.isCollapsed) {
      range = new Range(range.head, range.head.section.tailPosition());
    }
    editor.run(postEditor => {
      let nextPosition = postEditor.deleteRange(range);
      postEditor.setRange(new Range(nextPosition));
    });
  }
}, {
  str: 'CTRL+A',
  run(editor) {
    if (Browser.isMac) {
      gotoStartOfLine(editor);
    } else {
      selectAll(editor);
    }
  }
}, {
  str: 'META+LEFT',
  run(editor) {
    if (Browser.isMac) {
      gotoStartOfLine(editor);
    }
  }
}, {
  str: 'META+SHIFT+LEFT',
  run(editor) {
    if (Browser.isMac) {
      selectLineToLeft(editor);
    }
  }
},{
  str: 'META+A',
  run(editor) {
    if (Browser.isMac) {
      selectAll(editor);
    }
  }
}, {
  str: 'CTRL+E',
  run(editor) {
    if (Browser.isMac) {
      gotoEndOfLine(editor);
    }
  }
}, {
  str: 'META+RIGHT',
  run(editor) {
    if (Browser.isMac) {
      gotoEndOfLine(editor);
    }
  }
}, {
  str: 'META+SHIFT+RIGHT',
  run(editor) {
    if (Browser.isMac) {
      selectLineToRight(editor);
    }
  }
}, {
  str: 'META+K',
  run(editor) {
    if (editor.range.isCollapsed) {
      return;
    }

    let selectedText = editor.cursor.selectedText();
    let defaultUrl = '';
    if (selectedText.indexOf('http') !== -1) { defaultUrl = selectedText; }

    let {range} = editor;
    let hasLink = editor.detectMarkupInRange(range, 'a');

    if (hasLink) {
      editor.run(postEditor => postEditor.toggleMarkup('a'));
    } else {
      editor.showPrompt('Enter a URL', defaultUrl, url => {
        if (!url) { return; }

        editor.run(postEditor => {
          let markup = postEditor.builder.createMarkup('a', {href: url});
          postEditor.toggleMarkup(markup);
        });
      });
    }
  }
}, {
  str: 'META+Z',
  run(editor) {
    editor.run(postEditor => {
      postEditor.undoLastChange();
    });
  }
}, {
  str: 'META+SHIFT+Z',
  run(editor) {
    editor.run(postEditor => {
      postEditor.redoLastChange();
    });
  }
}, {
  str: 'CTRL+Z',
  run(editor) {
    if (Browser.isMac) { return false; }
    editor.run(postEditor => postEditor.undoLastChange());
  }
}, {
  str: 'CTRL+SHIFT+Z',
  run(editor) {
    if (Browser.isMac) { return false; }
    editor.run(postEditor => postEditor.redoLastChange());
  }
}];

function modifierNamesToMask(modiferNames) {
  let defaultVal = 0;
  return reduce(modiferNames,
                (sum, name) => {
                  let modifier = MODIFIERS[name.toUpperCase()];
                  assert(`No modifier named "${name}" found`, !!modifier);
                  return sum + modifier;
                },
                defaultVal);
}

function characterToCode(character) {
  const upperCharacter = character.toUpperCase();
  const special = SPECIAL_KEYS[upperCharacter];
  if (special) {
    return special;
  } else {
    assert(`Only 1 character can be used in a key command str (got "${character}")`,
           character.length === 1);
    return upperCharacter.charCodeAt(0);
  }
}

export function buildKeyCommand(keyCommand) {
  let { str } = keyCommand;

  if (!str) {
    return keyCommand;
  }
  assert('[deprecation] Key commands no longer use the `modifier` property',
         !keyCommand.modifier);

  let [character, ...modifierNames] = str.split('+').reverse();

  keyCommand.modifierMask = modifierNamesToMask(modifierNames);
  keyCommand.code = characterToCode(character);

  return keyCommand;
}

export function validateKeyCommand(keyCommand) {
  return !!keyCommand.code && !!keyCommand.run;
}

export function findKeyCommands(keyCommands, keyEvent) {
  const key = Key.fromEvent(keyEvent);

  return filter(keyCommands, ({modifierMask, code}) => {
    return key.keyCode === code && key.modifierMask === modifierMask;
  });
}
