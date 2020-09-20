const ratingSort = (a, b) => {
  if (a.rating === b.rating) {
    return 0;
  }
  return a.rating < b.rating ? 1 : -1;
};

module.exports = ratingSort;
