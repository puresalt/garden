const _clean = require('mysql').escape;

export default function Update() {
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
      return `UPDATE ${_clean(_table)} SET ${_fields.map(i => _clean(i) + ' = ?').join(',')}`;
    }
  };
}
