const express = require('express');
const tourController = require('./../controller/tourController');
let router = express.Router();
let authController = require("./../controller/authController");
const reviewRouter = require("./reviewRoutes");
const bookingRouter = require("./bookingRoutes")
//route after this will all get protected
// router.use(authController.protect);

//this route will hit only when route has id
router.param("id",(req,res,next,val)=>{
//     console.log("id",val);
    next() //Its very important to call
})

router.route("/top-5-tours").get(tourController.aliasTopTour,tourController.getAllTour);

router.route("/tours-stats").get(tourController.getTourStats)

router.route("/month-plan/:year").get(authController.protect,authController.restrictTo("admin","leadGuide","guide"),tourController.getMonthlyPlan)

//  api/v1/tours/tourID/reviews


router.use("/:tourId/reviews",reviewRouter);

router.use("/:tourId/bookings",bookingRouter);


// router.use(authController.isLoggedIn);

router.route("/tours-within/:distance/center/:latlng/unit/:unit").get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi


router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

router.route("/")
      .get(tourController.getAllTour)
      .post(tourController.checkData,tourController.createTour);


router.route("/:id")
      .get(tourController.getTour)
      .post(authController.protect,authController.restrictTo("admin","leadGuide"),tourController.uploadTourImages,tourController.resizeTourImages,tourController.updateTour)
      .delete(authController.protect,authController.restrictTo("admin"),tourController.deleteTour);


// router.route("/:tourId/reviews").post(authController.protect,authController.restrictTo("user"),reviewController.createReview)

module.exports = router;

