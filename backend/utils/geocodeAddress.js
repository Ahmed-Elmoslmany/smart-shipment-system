const axios = require('axios');
const dotenv = require("dotenv");

const geocodeAddress = async (address) => {
  const apiKey = process.env.GEOCODING_API_KEY; 
  const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
    params: {
      address,
      key: apiKey
    }
  });

  if (response.data.status !== 'OK') {
    throw new Error('Geocoding failed');
  }

  const location = response.data.results[0].geometry.location;
  return [location.lng, location.lat];
};

module.exports = geocodeAddress;
