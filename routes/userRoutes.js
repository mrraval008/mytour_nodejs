const express = require('express');

const userController = require('./../controller/userController');
const authController = require('./../controller/authController');

const bookingRouter = require('./../routes/bookingRoutes');




let router = express.Router();



router.post("/signup",authController.signup);
router.post("/login",authController.login);
router.post("/forgotPassword",authController.forgotPassword);
router.post("/resetPassword/:token",authController.resetPassword);
router.get("/isLoggedIn",authController.isLoggedIn);


//route that come after this, will all get authController.protect middleware

router.use(authController.protect);



router.get('/me',userController.getMe,userController.getUser);
router.patch("/updateMypassword",authController.updateMypassword);
router.post('/updateMe',userController.uploadUserPhoto,userController.resizeUserPhoto,userController.updateMe);
router.delete('/deleteMe',userController.deleteMe);
// upload.single('photo') here 'photo' is the field name from the form
 

router.use(authController.restrictTo("admin"));
//route that come after this, will all get authController.restrictTo middleware


router.route("/").get(userController.getAllUser).post(userController.createUser);
router.route("/:id").get(userController.getUser).patch(userController.updateUser).delete(authController.restrictTo('admin'),userController.deleteUser);

module.exports = router;

