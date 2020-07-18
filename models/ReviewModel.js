
const mongoose = require("mongoose");
let Tour = ""
setTimeout(()=>{
    Tour = require('./TourModel');  //need to fis this
    
},1000)

const userModel = require('./UserModel');



let reviewSchema = new mongoose.Schema({
    review:{
        type:String,
        required:[true,"Please provide review"]
    },
    rating:{
        type:Number,
        min:[1,"A rating must be more than 1.0"],
        max:[5,"A rating must be less than 5.0"]
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    tour:[
        {
            type:mongoose.Schema.ObjectId,
            ref:"Tour",
            required:[true,"A review must be belongs to one tour"]
        }
    ],
    user:[
        {
            type:mongoose.Schema.ObjectId,
            ref:"User",
            required:[true,"A review must be belongs to one user"]
        }
    ]
},
{
    toJSON:{virtuals:true},    
    toObject:{virtuals:true}
}
)

//Each user can write only one review for one tour,basically we dont allow duplicate
//solution is use index with unique option
// we can set unique seperately for tour and user otherwise tour will have only one review and user can write only one reviewSchema
//we need combionation of that
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });


reviewSchema.pre(/^find/,function(next){
    // this.populate({
    //     path:"tour",
    //     select:"name"
    // }).populate({
    //     path:"user",
    //     select:"role email"
    // }),

    //no need to populate tour here as in tour we are already populating review 
    this.populate({
            path:"user",
            select:"role email photo name"
    })
    next();
})

reviewSchema.statics.calcAverageRatings = async function(tourId){
    //here we talk about review model
    //this is refer to cally model,here review Model
    let statsData =  await this.aggregate([
      {
        $match:{
            tour:tourId
        },
    },{
        $group:{
            _id:"$tour",
            numOfRatings:{$sum:1},
            avgRatings:{$avg:"$rating"}
        }
    }
    ])
    if(statsData.length){
        await Tour.findByIdAndUpdate(tourId,{ratingsQuantity:statsData[0].numOfRatings,ratingsAverage:statsData[0].avgRatings})
    }else{
        //when all review deleted
        await Tour.findByIdAndUpdate(tourId,{ratingsQuantity:0,ratingsAverage:4.5})
    }
}


//We need to update tour data when ever any new review created.
reviewSchema.post("save",async function(){
    //this is refer to current review document
    //this.constructor is refer to model
    await this.constructor.calcAverageRatings(this.tour);   //here this.tour as we set in setTourAndUserId
  

})

//We need to update tour data when ever any review updated or deleted
//but for FindByIdAndUpdate and FindByIdAndDelete, does not have documnet middleware so we cant use reviewSchema.post("save")... on that
//we can use query middle ware in that

//here we are using findOneAnd as behind the scene FindByIdAndUpdate and FindByIdAndDeleteare using FindOneAndDelete and FindOneAndUpdate
reviewSchema.pre(/^findOneAnd/,async function(next){

    //this is query middleware,here we have access of query, but dont have access of docs
    // so solution is execute query which will retutn a document
    const docs = await this.findOne();

    //here issue is at this point of time when we update review, await this.findOne(); this will still give old review docs as it is pre
    //we cant change it to post reviewSchema.post("findOneAnd")... like this,as after post, query is no longer availible as its executed so we cant use this.findOne();

    // so the trick is we use post middleware and send data from this pre middleware
    this.docs = docs;  // passing to next middleware (i.e. post middleware)
    next();

})

reviewSchema.post(/^findOneAnd/,async function(){
    await this.docs.constructor.calcAverageRatings(this.docs.tour);
})


const Review = mongoose.model("Review",reviewSchema);


module.exports = Review;