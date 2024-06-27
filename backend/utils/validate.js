const axios = require('axios');

/**
 * Validate if the given string is a valid URL.
 * @param {string} url - The URL string to validate.
 * @returns {boolean} - True if the URL is valid, false otherwise.
 */
const isValidUrl = (url) => {
  const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
  return urlRegex.test(url);
};

/**
 * Validate if the given string is a valid image URL.
 * @param {string} url - The URL string to validate.
 * @returns {boolean} - True if the URL is a valid image URL, false otherwise.
 */
const isValidImageUrl = async (url) => {
  if (!isValidUrl(url)) {
    return false;
  }

  try {
    const response = await axios.head(url);
    const contentType = response.headers['content-type'];
    return contentType.startsWith('image/');
  } catch (error) {
    return false;
  }
};

module.exports = {
  isValidUrl,
  isValidImageUrl,
};
