const _clean = require('mysql').escape;

const ORDER = {
  ASCENDING: 'asc',
  DESCENDING: 'desc'
};
Object.freeze(ORDER);

export default function Order() {
  const _order = [];
  let _current = {
    alias: 'primary',
    by: null,
    direction: null
  };

  return {
    by(by, alias) {
      if (_current.by) {
        _order.push(`${_clean(_current.alias)}.${_clean(_current.by)} ${ORDER.ASCENDING}`);
        _current = {
          alias: 'primary',
          by: null,
          direction: null
        };
      }
      _current.by = by;
      _current.alias = alias || 'primary';
      return this;
    },
    direction(direction) {
      if (_current.by === null) {
        throw new RangeError('Incorrect chaining, please define a `by` first');
      }
      _order.push(`${_clean(_current.alias)}.${_clean(_current.by)} ${direction || ORDER.ASCENDING}`);
      _current = {
        alias: 'primary',
        by: null,
        direction: null
      };
      return this;
    },
    toString() {
      const currentOrder = _order.map(i => i);
      if (_current.by) {
        currentOrder.push(`${_clean(_current.alias)}.${_clean(_current.by)} ${_current.by || ORDER.ASCENDING}`);
      }
      if (!currentOrder.length) {
        return '';
      }
      return `ORDER BY ${currentOrder.join(',')}`;
    }
  };
}
