const _clean = require('mysql').escape;
const _aliasAndField = (field, alias) => `${alias ? _clean(alias) + '.' : ''}${_clean(field) || '*'}`;

export default function Select() {
  const _fragments = [];
  return {
    count(field, alias) {
      _fragments.push(`COUNT(${_aliasAndField(alias, field)})`);
    },
    field(field, alias) {
      _fragments.push(_aliasAndField(alias, field));
    },
    max(field, alias) {
      _fragments.push(`MAX(${_aliasAndField(alias, field)}`);
      return this;
    },
    min(field, alias) {
      _fragments.push(`MIN(${_aliasAndField(alias, field)}`);
      return this;
    },
    raw(data) {
      _fragments.push(data);
      return this;
    },
    toString() {
      return `SELECT ${_fragments.length ? _fragments.join(' ') : '*'}`;
    }
  };
}
