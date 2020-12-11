import Insert from './query/insert';
import Select from './query/select';
import Update from './query/update';
import Delete from './query/delete';
import From from './query/from';
import Where from './query/where';
import Having from './query/having';
import Order from './query/order';
import Limit from './query/limit';

export default function Query() {
  const _elements = {
    select: Select(),
    having: Having()
  };
  return {
    insert() {
      return {
        insert: Insert()
      };
    },
    select() {
      return {
        select: Select(),
        from: From(),
        where: Where(),
        having: Having(),
        order: Order(),
        limit: Limit()
      };
    },
    update() {
      return {
        update: Update(),
        where: Where(),
        limit: Limit()
      };
    },
    delete() {
      return {
        delete: Delete(),
        from: From(),
        where: Where(),
        limit: Limit()
      };
    },
    toString() {
      return Object.values(_elements).join(' ');
    }
  };
}
