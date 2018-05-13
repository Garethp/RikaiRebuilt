removeFromArray = (array, valueToRemove) => array.filter(value => value !== valueToRemove);

if (typeof process !== 'undefined') { module.exports = removeFromArray; }