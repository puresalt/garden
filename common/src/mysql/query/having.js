export default function Having() {
  const _fragments = [];

  return {
    raw(data) {
      _fragments.push(data);
    },
    toString() {
      return _fragments.length
        ? `HAVING (${_fragments.join(') AND (')})`
        : '';
    }
  };
}
