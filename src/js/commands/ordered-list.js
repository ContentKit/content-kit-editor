import ListCommand from './list';
import { inherit } from 'content-kit-utils';
import { Type } from 'content-kit-compiler';

function OrderedListCommand() {
  ListCommand.call(this, {
    name: 'ordered list',
    tag: Type.ORDERED_LIST.tag,
    action: 'insertOrderedList'
  });
}
inherit(OrderedListCommand, ListCommand);

OrderedListCommand.prototype.autoFormatRegex = /^1\.\s/;

export default OrderedListCommand;
