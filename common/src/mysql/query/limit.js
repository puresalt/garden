export default function Limit() {
  let _skip = null;
  let _limit = null;

  return {
    skip(skip) {
      _skip = skip;
      return this;
    },
    limit(limit) {
      _limit = limit;
      return this;
    },
    toString() {
      if (typeof _limit !== 'number') {
        return '';
      }
      return `LIMIT ${typeof _skip === 'number' ? String(_skip) + ', ' : ''}${_limit}`;
    }
  };
}
