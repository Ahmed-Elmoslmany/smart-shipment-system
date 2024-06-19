/**
 * Filters an object to only include allowed fields.
 * @param {Object} obj - The object to filter.
 * @param {...string} allowedFields - The fields to allow.
 * @returns {Object} - The filtered object.
 */
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(key => {
      if (allowedFields.includes(key)) {
        newObj[key] = obj[key];
      }
    });
    return newObj;
  };
  
  module.exports = filterObj;