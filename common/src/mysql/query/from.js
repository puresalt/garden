const _clean = require('mysql').escape;

const JOIN = {
  INNER: 'INNER',
  OUTER: 'OUTER',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT'
};
Object.freeze(JOIN);

export default function From() {
  let _string = '';
  let _tableCollection = [];
  let _primaryTable = {
    alias: '',
    table: ''
  };

  return {
    from(table, alias) {
      _string = '';
      _tableCollection = [];
      _primaryTable.table = table;
      _primaryTable.alias = alias;
      return this;
    },
    join(table, alias, mapping, type) {
      if (!_primaryTable.table) {
        throw new RangeError('Incorrect chaining, please define a `from` first');
      }
      _string = '';

      let rightAlias;
      let leftAlias;
      if (typeof alias === 'object') {
        leftAlias = Object.keys(alias)[0];
        rightAlias = Object.values(alias)[0];
      } else {
        leftAlias = _primaryTable.alias;
        rightAlias = alias;
      }
      if (leftAlias) {
        leftAlias = _clean(leftAlias);
      }
      if (rightAlias) {
        rightAlias = _clean(rightAlias);
      }

      const on = Object.keys(mapping).reduce((gathered, subMapping) => {
        const ors = Object.keys(subMapping).reduce((subGathered, item) => {
          subGathered.push(`${leftAlias ? leftAlias + '.' : ''}${_clean(item)} = ${rightAlias ? rightAlias + '.' : ''}${_clean(subMapping[item])}`);
          return subGathered;
        }, []).join(' OR ');
        if (ors.length) {
          gathered.push(ors);
        }
        return gathered;
      }, []);

      _tableCollection.push({
        table: table,
        alias: alias,
        type: JOIN[type] ? JOIN[type] : JOIN.LEFT,
        on: on.join(' AND ')
      });
      return this;
    },
    innerJoin(table, alias, mapping) {
      return this.join(table, alias, mapping, JOIN.INNER);
    },
    outerJoin(table, alias, mapping) {
      return this.join(table, alias, mapping, JOIN.OUTER);
    },
    leftJoin(table, alias, mapping) {
      return this.join(table, alias, mapping, JOIN.LEFT);
    },
    rightJoin(table, alias, mapping) {
      return this.join(table, alias, mapping, JOIN.RIGHT);
    },
    toString() {
      if (_string) {
        return _string;
      }
      if (!_primaryTable.table) {
        return '';
      }
      _string = `FROM ${_clean(_primaryTable.table)}${_primaryTable.alias ? ' ' + _clean(_primaryTable.alias) : ''}`;
      _string += _tableCollection.map(table => `${table.type} JOIN ${_clean(table.table)} ${_clean(table.alias)}`).join(' ');
      return _string;
    }
  };
}
