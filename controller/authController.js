const crypto = require('crypto');
const User = require('./../models/UserModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const {promisify} = require("util");
const Email = require('./../utils/email');



const signInToken = (id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    })
}

const createAndSendToken = (user,statusCode,res,userData)=>{
    let token = signInToken(user._id);

    //send jwt token in cookie
    let cookieOption = {
        expires:new Date(Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000),
        secure:process.env.NODE_ENV === 'production' ? true : false,
        httpOnly:true
    }
    res.cookie("jwt",token,cookieOption);
    // secure:true  cookie only send in encrypted connection(only to https)
    // httpOnly:true    cookes can not be access and modified by broweser and to save from cross scripting attack
    let obj = {
        status:"success",
        token
    }

    user.password = undefined // dont show passowrd in response

    if(userData){
        obj["data"] = {
            user:userData
        }
    }
    res.status(200).json(obj);
}



const signup = catchAsync(async (req,res,next)=>{
    let userData = {name,email,password,passwordConfirm,photo} = req.body;   //to 
    // console.log("userData",userData)
    const newUser = await User.create(userData);

    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser,url).sendWelcome();

    createAndSendToken(newUser,201,res,userData);
    
    // let token = signInToken(newUser._id);
    
    //expire option JWT_EXPIRES_IN =>
                                // 90d => means 90days
                                // 10m => 10 minutes
                                // 10h => 10 hours 
                                // 10s => 10 seconds
    // go to jwt.io to debug token
    // res.status(201).json({
    //     status:"success",
    //     token,
    //     data:{
    //         user:newUser
    //     }
    // })
});





const login = async (req,res,next)=>{

    const {email,password} = req.body;

    // 1)if username & passord exists
    if(!email || !password){
        return next(new AppError("Please provide username and password"));
    }

    // 2. check if user exists

    let user = await User.findOne({email}).select("+password")   //here we need password ,but in schema we have select false,so when we query,it will not come, so while querying put select("+password")

    // 3.if everything ok,send token to client
    //if no user than no need to call correctpassword,so did like below
    if(!user || !(await user.correctPassword(password,user.password))){    //user is document returend,so methods defined on userschema will be availible on that
        let err = new AppError(`Incorrect email or password`,"401")
        return next(err);
    }
    createAndSendToken(user,200,res,user);
    
    
    // const token = signInToken(user._id);

    // //for login, we just need to send token to client , dont send user data in response
    // res.status(200).json({
    //     status:"success",
    //     token
    // })

}


const protect = catchAsync(async (req,res,next)=>{

    // 1. Getting token and check if its exist
        
    //token will be there in header
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1];
    }else if(req.cookies.jwt){
        token = req.cookies.jwt
    }

    if(!token){
        return next(new AppError("Yor are logged out,please log in to get access."));
    }


    // 2. verificaton token
    // jwt.verify is sync function,we need to promisify it
    let decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET);


    // 3.Check if user still exist  // this step is for what if after token issued,user is deleted

    let currentUser = await User.findById(decoded.id)   //decoded.id is user ID
    if(!currentUser){
        return next(new AppError("The User belongs to token does no longer exist",401));
    }

    // 4. check if user changed password
    //statregy here is 
        // when user created password(or when user created) we have setting current timestamp to  passwordChangedAt proprty of User
        // when user loggedin than we have given one token to him,in that we have property iat(issued at) property,which tell at what time we have  issued token
        //here we will check if time at which token issued is less than passwordChangedAt property means user has changed password
   
    if(currentUser.isUserhasChangePassword(decoded.iat)){
        return next(new AppError("Password has been changed,please relogin to get access.",401))
    }
       
    //5. Grant access
    req.user = currentUser;  //for restrictTo function
    // res.user = currentUser;
    next();

})


// we can not pass arguments in middleware function
// so here we return a function whcih has access of roles
const restrictTo = (...roles)=>{

    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return next(new AppError("You don't have persmission to perform this action",403));
        }

        next();
    }

}

const forgotPassword = catchAsync(async (req,res,next)=>{

    //get User
    let user = await User.findOne({"email":req.body.email});

    if(!user){
        return next(new AppError("No User found with this email ID",404));
    }

    // 1. generate token
    let token = user.createPasswordResetToken();

    // 2.Store encrypted token 
    user.save({validateBeforeSave:false})   // as save operation will resuire email password,and here we just modify passwordResetToken and passwordResetExpire
    
    // 4.send mail

    let resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${token}`

    // let message = `Forgot your password ? Submit your password here ${resetUrl}`

    // console.log(message)
    // await sendEmail({
    //     email:req.body.email,
    //     subject:"Password reset Link (expires in 10 minutes)",
    //     message
    // })

    await new Email(user,resetUrl).sendPasswordReset();


    res.status(200).json({
        status:"success",
        message:'Token sent to mail'
    })
})


const resetPassword = catchAsync( async (req,res,next)=>{
    //get token from parameters
    let token = req.params.token

    //get the user 
    let encyptedToken = crypto.createHash("sha256").update(token).digest("hex");

    let user = await User.findOne({passwordResetToken:encyptedToken,passwordResetExpire:{$gte:Date.now()}})

    if(!user){
        return next(new AppError("Your token is invalid or has expired.",400))
    }

    //Update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;

    await user.save();
    createAndSendToken(user,200,res);
})


const updateMypassword = catchAsync(async (req,res,next)=>{

    const {email,password} = req.body;
    let user = await User.findOne({email}).select("+password")

    let isVerified = await user.correctPassword(password,user.password)

    if(!user || !isVerified){
        return next(new AppError(`Incorrect email or password`,"401"));
    }
     //Update password
     user.password = req.body.updatedPassword;
     user.passwordConfirm = req.body.updatedPasswordConfirm;
     
     await user.save();    //as we need to run validators and save middleware
     
     res.status(200).json();
     
})

const filterFields = (reqBody)=>{
    let allowedFields = ["email","photo","name"]
    let filterFields = {};
    Object.keys(reqBody).forEach(elem=>{
        if(allowedFields.includes(elem)){
            filterFields[elem] = reqBody[elem];
        }
    });
    return filterFields;
}

//only for render pages ,not for errors
const isLoggedIn = catchAsync(async (req,res,next)=>{
    
        if(req.cookies.jwt){
            let token;
        
            token = req.cookies.jwt
    
        let decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET);
    
        let currentUser = await User.findById(decoded.id)   //decoded.id is user ID
        if(!currentUser){
            return next();
        }
    
        if(currentUser.isUserhasChangePassword(decoded.iat)){
            return next()
        }
           
        //There is a looged in user
        //this is for UI to render pages based on if user already logged in
        res.currentUser = currentUser
        return next();
    }
    next();
    
    })

// const updateUser = catchAsync(async (req,res,next)=>{
//     console.log(req.body)
//     //dont allow password update here
//     if(req.body.password){
//         return next(new AppError("Password update not allowed in this route."));
//     }
    
//     //filter fields from req.body
//     let fieldsObj = filterFields(req.body);

//     //update user
//     let updatedUser = await User.findByIdAndUpdate(req.params.id,fieldsObj,{new:true,runValidators:true});
    
//     //send response
//     res.status(200).json({
//         status:"Success",
//         message:"User data updated succesfully."
//     })
// })

// const deleteUser = catchAsync(async (req,res,next)=>{

//     //set active flag to false
//     await User.findByIdAndUpdate(req.params.id,{active:false});

//     res.status(200).json({
//         status:"Success",
//         message:"User deleted succesfully."
//     })


// })


module.exports = {
    signup,
    login,
    protect,
    restrictTo,
    forgotPassword,
    resetPassword,
    updateMypassword,
    isLoggedIn
}