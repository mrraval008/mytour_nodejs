class APIFeatures {
    constructor(query,queryStr){
        this.query = query;
        this.queryStr = queryStr
    }


    filter(){
        for(let key in this.queryStr){
            let val = this.queryStr[key]
            if(val.startsWith("{") && val.endsWith("}")){
                this.queryStr[key] = JSON.parse(val);
            }
        }
        let queryStr = JSON.stringify(this.queryStr);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g,match=>{
            return `$${match}`
        })

        queryStr = JSON.parse(queryStr);
        if(queryStr["name"]){
            queryStr["slug"] = new RegExp(queryStr["name"],'i');
            delete queryStr["name"]
        }
        let queryObj = { ...queryStr }
        let excludedFields = ['page','limit','sort','fields'];
        excludedFields.forEach(field=>{
            delete queryObj[field]; 
        });
        
        if(queryObj['role']){
            queryObj=  {
                'role': {
                  '$in': [
                    'guide', 'lead-guide'
                  ]
                }
              }
        }
        this.query.find(queryObj);
        return this;
    }

    sort(){
        if(this.queryStr.sort){
            let sortBy = this.queryStr.sort.split(",").join(" ");
            // console.log("sortBy",sortBy)
            this.query = this.query.sort(sortBy)
        }else{
            this.query = this.query.sort('-createdAt');
        }
        return this;

    }

    limitFields(){
        if(this.queryStr.fields){
            const fields = this.queryStr.fields.split(",").join(" ");
            this.query = this.query.select(fields);
        }else{
            this.query = this.query.select('-__v'); //excluding __field , - is for excluding
        }
        return this;
    }

    pagination(){
        let page = this.queryStr.page * 1;
        let limit = this.queryStr.limit * 1;
        let skip = (page - 1) * limit;
        this.query.skip(skip).limit(limit);
        return this;
    }
}

module.exports = APIFeatures;