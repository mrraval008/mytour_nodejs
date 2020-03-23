let mongoose = require('mongoose');
let slugify = require('slugify');
let validator = require('validator');
const Review = require('./ReviewModel');


const User = require('./UserModel');


//Most basic schema
// let tourSchema = new mongoose.Schema({
//     "name":String,
//     "price":Number,
//     "rating":Number
// })

//Schema with more option
let tourSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true,'A tour must have a name'], //second arg is what error you wqant to show if name is not presenece
        unique:true, //Two document should not have same name
        trim:true,     //remove all white space from beginning and the end
        maxlength:[40,'A tour name must have less than 40 chars'],
        minlength:[5,'A tour name must have more than 5 chars'],
        // validate:[validator.isAlpha,"Name should contian only characters"]  //it will not allow spaces
    },
    duration:{
        type:Number,
        required:[true,"A tour must have duration"]
    },
    maxGroupSize:{
        type:Number,
        required:[true,"A tour must have group size"]
    },
    difficulty:{
        type:String,
        required:[true,"A tour must have difficulty"],
        enum:{                              // to restrict option for difficulty
           values: ["easy","medium","difficult"],
           message:'Difficulty is either "easy","medium","dificult'
        }   
    },
    ratingsAverage:{
        type:Number,
        default:4.5,
        min:[1,"A rating must be more than 1.0"],
        max:[5,"A rating must be lest than 5.0"],
        set: val => Math.round((val*10)) / 10            //this will run every time when ratingsAverage is set to docs
                                                        // why we need this as we are getting average like 4.6666666
                                                        // if we do  Math.round(val) than in case of 4.66666 it will roudnd to 5
                                                        // what we need is it should round to 4.7
                                                        // so 4.6666 * 10 => 46.66 => Math.round(46.66) => 47 => 47 / 10 => 4.7
    },
    ratingsQuantity:{
        type:Number,
        default:0
    },
    price:{
        type:Number,
        required:[true,'A tour must have price']
    },
    rating:{
        type:Number,
        default:4.5 //if rating is not given .it will take 4.5
    },
    priceDiscount:{
        type:Number,
        validate:{
            validator:function(val){    //custom validator
                return val < this.price;   //THIS IS REFER TO CURRENT DOCUMENT
            },
            message:'Discount should be less then ({VALUE})'
        }
    },
    summary:{
        type:String,
        trim:true,
        required:[true,'A tour must have summary']
    },
    description:{
        type:String,
        trim:true
    },
    imageCover:{
        type:String,
        trim:true,
        required:[true,'A tour must have imageCover']
    },
    images:[String],
    createdAt:{
        type:Date,
        default:Date.now(),
        select:false   // by Default it will never come in query results, in find query 
    },
    startDates:[Date],
    slug:{
        type:String
    },
    secretTour:{
        type:Boolean,
        default:false
    },
    startLocation:{
        //GeoJSON
        type:{
            type:String,
            default:'Point',
            enum:["Point"]
        },
        coordinates:[Number],  // longitude latitude
        address:String,
        description:String
     },
     //By specifying array of object,it will automatically create new documents inside that tour document
     locations:[
        {
            type:{
                type:String,
                default:'Point',
                enum:["Point"]
            },
            coordinates:[Number], 
            address:String,
            description:String,
            day:Number
        }
    ],
    //Referencing User here
    guides:[
        {
            type:mongoose.Schema.ObjectId,
            ref:"User"
        }
    ]
},{
    toJSON:{virtuals:true},    //this is to show virtual property in output
    toObject:{virtuals:true}
}
)


//By default mongo will put index on _id so _id will get stored in seperate docs. so when we search by id ,it will not look in to entire collection
//it will look in to that _id collection and find indexes
//We can do same thing to improve performance on reading docs
//lets say we are frequently filtering on price
//so we are putting index on price.
//we cant put index on all fields but its costly operation

//its a single field index
// /api/v1/tours?price[lt]=1000

// tourSchema.index({price:1});


//its a compund index
//it will work for single index also
//   /api/v1/tours?price[lt]=1000&ratingsAverage[gte]=4.7
tourSchema.index({price:1, ratingsAverage :-1});   // -1 means in descendig order
tourSchema.index({ startLocation: '2dsphere' });//to enable geo special query

// 2dsphere for real location on earth
// 2d for normal point location







//virtaul means ,it will be not there in database,but it will come in result when you make query
//we cant use durationInWeek in query like get me tours where durationInWeek = 3
//we need to make virtuals:true in schema
tourSchema.virtual("durationInWeek").get(function(){
    return this.duration/7;                 
})


//virtaul populate review in tours
tourSchema.virtual("reviews",{
    ref:"Review",
    foreignField:'tour',   //this is same name as in reviewModel
    localField:"_id"
})


//DOCUMENT Middleware
    
    // 'save' middle ware will trigger on save() and create() command, not on insertone,UPDATE
    //it will trigger before any save operation
    tourSchema.pre('save',function(next){
        this.slug = slugify(this.name,{upper:true})
        // console.log(this)   // current document
        next();
    });

    //we are embedding users here
    // use guides:Array
    // tourSchema.pre('save',async function(next){
    //     let userDataPromises = this.guides.map(async userId => {
    //             return await User.findById(userId)
    //     });
    //     //we are embedding users here
    //     this.guides =  await Promise.all(userDataPromises);
    //     next();
    // });





    tourSchema.post('save',function(doc , next){
        // console.log(doc)  //finished document
        next();
    })


//QUERY Middleware
    //lets say I dont want to show some secret tour to all customer
    //this will only run for find,not for findone
    // tourSchema.pre('find',function(next){
    //     this.find({secretTour:{$ne:true}})   //this is refer to mongodb Query object 
    //     next();
    // })

    // To fix above issue use regular expression, any string which will start with find, ex. findOne,findMany,findAndupdate
    tourSchema.pre(/^find/,function(next){
           //this is refer to mongodb Query object 
        this.find({secretTour:{$ne:true}})
        next();
    });

    tourSchema.pre(/^find/,function(next){
        this.populate({
            path:'guides',
            select:'-__v-passwordChangedAt'   //it will not show in results as we have minus
        });   //.populate('guides') as we have refrence of the user in tour,this poulate will fill up the actual user data in find query
        next();
    })

    tourSchema.post(/^find/,function(docs,next){
        // console.log(docs)
        next();
    })


 


//AGGREGATION Middleware
// issue here is  secret tour still coming in aggrrgation,to solve this,use AGGREGATION Middleware

    tourSchema.pre('aggregate',function(next){
        
        if(this.pipeline.length > 0 && !Object.keys(this.pipeline[0]).includes($geoNear)){   // as geonear pipeline which we are using in this method of tourcontroller getDistances,alwayrs needs $geoNear at first stage we need to check here
            //add one more aggregate function in the beginning
            this.pipeline().unshift({
                $match:{
                    secretTour:{$ne:true}
                }
            })
            // console.log(this.pipeline()) // this refer to all aggregate array 
            next();
        }else{
            next();
        }
    })





const Tour = mongoose.model('Tour',tourSchema);  //It will create new collection named 'tours'(it will take name from 'Tour' and make plural)

module.exports = Tour;
