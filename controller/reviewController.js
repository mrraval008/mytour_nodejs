const Review = require('./../models/ReviewModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./factoryController');


const getAllReviews = factory.getAll(Review);
//  catchAsync(async (req,res,next)=>{
//     let filter = {}
//     if(req.params.tourId){
//         filter = {tour:req.params.tourId}
//     }
//     let reviews = await Review.find(filter);

//     res.status(200).json({
//         status:"Success",
//         results:reviews.length,
//         reviews
//     })
// })


const getReview = factory.getOne(Review)
// catchAsync(async (req,res,next)=>{
//     let review = await Review.findById(req.params.id);

//     if(!review){
//         return next(new AppError("No review found for this ID",404))
//     }

//     res.status(200).json({
//         status:"success",
//         review
//     })
// })

const setTourAndUserId = (req,res,next)=>{
    console.log(req.body)
    if(!req.body.tour) {
        req.body.tour = req.params.tourId;
    }
    if(!req.body.user) {
        req.body.user = req.user.id;
    }
    next();
}


const createReview = factory.createOne(Review);
// catchAsync(async (req,res,next)=>{

//     // if(!req.body.tours) {
//     //     req.body.tours = req.params.tourId
//     // }
//     // if(!req.body.guides) {
//     //     req.body.guides = req.user.id;
//     // }


//     let review = await Review.create(req.body);
//     res.status(201).json({
//         status:"Success",
//         review
//     })
// })



const updateReview = factory.updateOne(Review);


const deleteReview = factory.deleteOne(Review);



module.exports = {
    getAllReviews,
    createReview,
    getReview,
    updateReview,
    deleteReview,
    setTourAndUserId
}