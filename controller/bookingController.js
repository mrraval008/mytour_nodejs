const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const Booking = require('./../models/BookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const factory = require('./factoryController');
const Tour = require('./../models/TourModel');

const getAllBookings = factory.getAll(Booking);

const createBooking = factory.createOne(Booking);

const updateBooking = factory.updateOne(Booking);

const deleteBooking = factory.deleteOne(Booking);

const getBooking = factory.getOne(Booking);

const getMyBookings = catchAsync(async (req,res,next)=>{
    req.query.user = req.user.id;
    next()
})

const setTourAndUserId = (req,res,next)=>{
    if(!req.body.tour) {
        req.body.tour = req.params.tourId
    }
    if(!req.body.user) {
        req.body.user = req.user.id;
    }
    next();
}

const getCheckoutSession = catchAsync( async (req,res,next)=>{
    //1. get currenclty booked tour

    const tour = await Tour.findById(req.params.tourId);

    //2. create checkout session
    const session =await stripe.checkout.sessions.create({
        payment_method_types:['card'],
        success_url:`http://localhost:4200/tourDetails/${req.params.tourId}`, //after successfully card payment user will redirect to this page
        cancel_url:`http://localhost:4200/tourDetails/${req.params.tourId}`,//after error in card payment user will redirect to this page
        customer_email:req.user.email,
        client_reference_id:req.params.tourId,
        line_items:[
            {
                name: `${tour.name} Tour`,
                description:tour.summary,
                images:['https://www.natours.dev/img/tours/tour-1-cover.jpg'],
                amount: tour.price * 100,
                currency:'inr',
                quantity:1
            }
        ]

    })

    //3. send it to client
    res.status(200).json({
        status:'success',
        session:session
    })
})

module.exports = {
    getAllBookings,
    createBooking,
    updateBooking,
    deleteBooking,
    getBooking,
    setTourAndUserId,
    getCheckoutSession,
    getMyBookings
}