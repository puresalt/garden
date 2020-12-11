import {EventEmitter} from 'events';

class MysqlEventEmitter extends EventEmitter {
}

/**
 *
 * @param {mysql} database
 */
function Manager(database) {
  const _eventEmitter = new MysqlEventEmitter();
  return {
    async load(loadBy, model) {
      _eventEmitter.emit('load:pre', model, loadBy, this);
      database.query();
    },
    save(model) {
      _eventEmitter.emit('save:pre', model, this);
    },
    delete(model) {

    },
    on(...args) {
      _eventEmitter.on(...args);
      return this;
    },
    off(...args) {
      _eventEmitter.off(...args);
      return this;
    }
  };
}

const FIELD_TYPE = {
  BOOLEAN: 'tinyint(1) NOT NULL DEFAULT \'0\'',
  DATE: 'datetime NOT NULL DEFAULT \'0000-00-00 00:00:00\'',
  ID: 'int(16) unsigned NOT NULL',
  INT: 'int(16) signed NOT NULL',
  DECIMAL: 'decimal(8,4) signed NOT NULL',
  FLOAT: 'float(8,4) signed NOT NULL',
  SLUG: 'varchar(32) NOT NULL',
  TEXT: 'text NOT NULL',
  TINY_INT: 'tinyint(4) signed NOT NULL',
  VARIABLE: 'varchar(255) NOT NULL'
};
Object.freeze(FIELD_TYPE);

module.exports = {
  Manager: Manager,
  FIELD_TYPE: Object.keys(FIELD_TYPE)
};
