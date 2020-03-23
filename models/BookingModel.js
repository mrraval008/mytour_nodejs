const mongoose = require("mongoose");
const userModel = require('./UserModel');

let Tour = ""
setTimeout(()=>{
    Tour = require('./TourModel');  //need to fis this
    
},1000)

let bookingSchema = new mongoose.Schema({
    bookingSatus:{
        type:String
    },
    bookingDate:{
        type:Date
    },
    tour:[
        {
            type:mongoose.Schema.ObjectId,
            ref:"Tour",
            required:[true,"A Booking must be belongs to one tour"]
        }
    ],
    user:[
        {
            type:mongoose.Schema.ObjectId,
            ref:"User",
            required:[true,"A Booking must be belongs to one user"]
        }
    ],
    price: {
        type: Number,
        require: [true, 'Booking must have a price.']
      },
    createdAt:{
        type: Date,
        default: Date.now()
    }

})

// bookingSchema.index({ tour: 1, user: 1 }, { unique: true });

bookingSchema.pre(/^find/,function(next){
    this.populate('user').populate({
        path: 'tour',
        select: 'name'
      });
    next();
})


const Booking = mongoose.model("Booking",bookingSchema);

module.exports = Booking;