let express = require("express");
let reviewController = require('./../controller/reviewController');
let authController = require('./../controller/authController');


let reviewRouter = express.Router({mergeParams:true});   // mergeparams => as we are putting nested route in tourRoutes fro review,we need access of tourid which is there in tourroute,so we merge all params so that we can get access of tourid in reviewrouts

reviewRouter.use(authController.protect);

reviewRouter.route("/").get(reviewController.getAllReviews).post(authController.restrictTo("admin"),reviewController.setTourAndUserId,reviewController.createReview);
reviewRouter.route("/:id").get(reviewController.getReview).patch(authController.restrictTo("admin","user"),reviewController.updateReview).delete(authController.restrictTo("admin","user"),reviewController.deleteReview);



module.exports = reviewRouter;