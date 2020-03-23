let fs = require('fs');
let express = require('express');
let morgan = require('morgan')

let rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const hpp = require("hpp");

var cors = require('cors')

var cookieParser = require('cookie-parser'); 


let AppError = require('./utils/appError');


let tourRouter = require('./routes/tourRoutes');
let userRouter = require('./routes/userRoutes');
let reviewRouter = require('./routes/reviewRoutes');
let bookingRouter = require('./routes/bookingRoutes')
let errorController = require('./controller/errorController');



let app = express();




//Middledwares
app.use(cors())

app.use(helmet());   // set security http headers middleware



// allow only 100 request in one hour   // to prevent from deanil of service or bruit force attacks
const limiter = rateLimit({
    max:100,
    windowMs: 60 * 60 * 1000,
    message:"Too Many request from this IP,please try after one hour"
})

//only protect /api route
app.use('/api',limiter);


// body parser and reading data from body into req.body  // limit body data to 10kb
app.use(express.json({limit:"10kb"}));  

app.use(cookieParser());


// data sanitization against NoSQL query injection
// / issue here is in postman try to login with following Query
// {
//     email:{$gte:""}  //this will match all user
//     password:"pass123" //any valid user's password
// }
// you can logged even without email
app.use(mongoSanitize());   //it will remove remove $ sign from req body ,req query string and req params


// data sanitization against XSS
// {
    //     email:miln@gmail.com
    //     password:"pass123",
            // "name":"<div id="bad-code">Name</div>"

    // }
    // so what xssclean will do is
    // {
        //     email:miln@gmail.com
        //     password:"pass123",
                // "name":"&lt;div id="bad-code">Name&lt:/div>"
    
        // }
app.use(xssClean());    // try to attack with some javascript code inside html code, what it will do is it will convert all html symbols



// issue is what if I give URL like this https://127.0.0.1/api/va/tours?sort="price"&sort="duration"
// what express will do is as we have duplicate it will convert into Array
// so request.params.sort = ["price","duration"]
// what hpp will do, it will consider last one only and remove others
// so request.params.sort = "duration"
// app.use(hpp())  // to prevent paramter pollution

// But what if we want some params like duration
// so to whitelist

app.use(hpp({
    whitelist:["duration","ratingsQuantity","ratingsAverage","price","maxGroupSize","difficulty"]
}))


if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'))
}
//own middle ware
app.use((req,res,next)=>{
    console.log("req.files",req.files)
    // console.log("req.files1",req.photo)
    
    req.requestTime = new Date().toISOString();
    next()
})

// To serve Static files
app.use(express.static(`${__dirname}/public`)); //try http://127.0.0.1:3000/overview.html

// Handled Routes
app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/review',reviewRouter);
app.use('/api/v1/bookings',bookingRouter)


//handle unhandled routes
// all means all http method, ex Get,Post,Delete etc
//call http://127.0.0.1:3000/api/v1/whatever
app.all('*',function(req,res,next){

//     let err = new Error(`Cant find  ${req.originalUrl} on this server` ) //what ever you pass in this Error function it will create property called 'message'
//    err.status = "error",
//    err.statusCode = 404

//Better handled above code
    let err = new AppError(`Cant find  ${req.originalUrl} on this server`,"504");
   next(err)  //when ever we pass anything in next function,express will consider it as error ,jump all middleware after that and jump to error middleware

})

//ERROR handling middleware
// by specifying 4 args express will makeout its a error handling middleware
app.use(errorController)

//when ever we pass anything in next function,express will consider it as error ,jump all middleware after that and jump to error middleware

module.exports = app;

// https://documenter.getpostman.com/view/4237486/S1LwxnaE?version=latest#307dda9d-5723-45f5-a3ea-7f76c7191b25