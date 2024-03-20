class APIFeatures{
    constructor(query,queryStr){
      this.query = query ;
      this.queryStr = queryStr;
    }
  
  
    filter(){
    const queryObj = { ...this.queryStr }
    let excludedEl = ['page', 'sort', 'limit', 'fields'];
    excludedEl.forEach(element => {
      delete queryObj[element]
    });
  
    // const tours = await Tour.find(queryObj)
    // const tours = await Tour.find().where(duration).equals(5)
  
    // 1) Filtering------------
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replaceAll('gte', '$gte');
    // queryStr =queryStr.replaceAll('gt','$gt');
  
    queryString = queryString.replaceAll('lte', '$lte');
    // queryStr =queryStr.replaceAll('lt','$lt');
  
    // let query = Tour.find(JSON.parse(queryString));
    this.query = this.query.find(JSON.parse(queryString))
    return this;
    };
  
    sort(){
      if (this.queryStr.sort) {
        let sortBy = this.queryStr.sort.split(',').join(' ');
        this.query = this.query.sort(sortBy);
      } else {
        this.query.sort('-createdAt')
      }
  
      return this;
  
    }
  
    limitFields(){
      if (this.queryStr.fields) {
        let fields = this.queryStr.fields.split(',').join(' ');
        console.log(fields)
        this.query = this.query.select(fields);
      } else {
        this.query = this.query.select('-__v');
      }
  
      return this;
    }
  
    paginate(){
      let page = this.queryStr.page * 1;
      let limit = this.queryStr.limit * 1;
      let skip = (page - 1) * limit;
      this.query = this.query.skip(skip).limit(limit);
    
      return this;
    }
  
  } 

  module.exports = APIFeatures