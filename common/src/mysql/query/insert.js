const _clean = require('mysql').escape;

export default function Insert() {
  let _table = '';
  let _fields = [];
  return {
    table(table) {
      _table = table;
      return this;
    },
    add(field) {
      _fields.push(field);
      return this;
    },
    remove(field) {
      const index = _fields.indexOf(field);
      if (index > -1) {
        _fields.splice(index);
      }
      return this;
    },
    toString() {
      if (!_table || !_fields.length) {
        return '';
      }
      return `INSERT INTO ${_clean(_table)} (${_fields.map(_clean).join(',')}) VALUES (${_fields.map(i => '?').join(',')})`;
    }
  };
}
