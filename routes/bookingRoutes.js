let express = require("express");
let bookingController =  require('./../controller/bookingController');
let authController = require('./../controller/authController');


let bookingRouter = express.Router({mergeParams:true});

bookingRouter.use(authController.protect);

bookingRouter.route("/myBookings").get(bookingController.getMyBookings,bookingController.getAllBookings)

bookingRouter.route("/").get(authController.restrictTo('admin', 'lead-guide', 'guide'),bookingController.getAllBookings).post(bookingController.setTourAndUserId,bookingController.createBooking);
bookingRouter.route("/:id").get(bookingController.getBooking).patch(bookingController.updateBooking).delete(bookingController.deleteBooking);

bookingRouter.get('/checkout-session/:tourId',bookingController.getCheckoutSession)

module.exports = bookingRouter;