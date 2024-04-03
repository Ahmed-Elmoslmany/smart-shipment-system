class APIFeatures {
    constructor(query, queryString) {
      this.query = query;
      this.queryString = queryString;
    }
  
    filter() {
      const queryObj = { ...this.queryString };
      const excultedFields = ['page', 'limit', 'sort', 'fields'];
      excultedFields.map((el) => delete queryObj[el]);
  
      // 1B) Advanced filtering
      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(/\b(gte|gt|lte|te)\b/g, (match) => `$${match}`);
  
      this.query.find(JSON.parse(queryStr));
  
      return this; // return the entire object
    }
  
    sort() {
      if (this.queryString.sort) {
        const sortBy = this.queryString.sort.split(',').join(' '); // group all fields that data should sorted depended on it.
        this.query.sort(sortBy);
      } else {
        this.query.sort('-createdAt'); // default sort by oldest creation
      }
      return this; // return the entire object
    }
  
    limitFields() {
      if (this.queryString.fields) {
        const fields = this.queryString.fields.split(',').join(' ');
        this.query.select(fields);
      } else {
        this.query.select('-__v'); //ignore __v attribute that is default attribute by mongoDB
      }
      return this; // return the entire object
    }
  
    paginate() {
      const page = this.queryString.page * 1 || 1; // We mutiple by 1 to convert it to number
      const limit = this.queryString.limit * 1 || 50; // We mutiple by 1 to convert it to number
      const skip = (page - 1) * limit; // Number of documents should skip
  
      this.query.skip(skip).limit(limit);
  
      return this; // return the entire object
    }
  }

  module.exports = APIFeatures