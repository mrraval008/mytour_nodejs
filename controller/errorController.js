const AppError = require('./../utils/appError');


const handledCastErrorDB = (error)=>{
    let message =  `Invalid ${error.path} : ${error.value}`;
    return new AppError(message,400);
}


const handledDuplicateErrorDB = (error)=>{
    let value = error.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
    let message =  `Duplicate value for found  for ${value}. Please give another value.`
    return new AppError(message,400);
}

const handledValidationErrorDB = (error)=>{
    let messageArr = [];
    if(error.errors){
        for(let key in error.errors){
            messageArr.push(error.errors[key].message)
        }
    }
    // OR
    // let messageArr = Object.value(error.errors).map(elm => elm.message);
    let message =  `Invalid Value(s) : ${messageArr.join(",")}`;
    return new AppError(message,400);
}


const handledJWTTokenError = ()=>{
    return new AppError("Invalid Token.Please Login Again","401");
}

const handledTokenExiredError = ()=>{
    return new AppError("Your token has expired.Please Login Again","401");
}

const errorForDev = (err,res)=>{
    res.status(err.statusCode).json({
        status:err.status,
        error:err,
        stack:err.stack,
        message:err.message
    })
}

const errorForProd = (err,res)=>{
    // if is operational, its trusted error,send message to client
    if(err.isOperational){
        res.status(err.statusCode).json({
            status:err.status,
            message:err.message
        })

    // Programming or other errors,dont leak error details
    }else{
        // 1) log error
        console.error('ERROR ', err)

        //2) send generic message
        res.status(500).json({
            status:'error',
            message:"Something went wrong"
        })
    }
 
}

module.exports = (err,req,res,next)=>{
    // console.log(err.stack)  // this will display where exactly error happended and show all the stacks
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error"
    if(process.env.NODE_ENV.trim() == 'development'){
        errorForDev(err,res);
    }else if(process.env.NODE_ENV.trim() == 'production'){
        let error = {...err};  //hard copy
        if(error.name === "CastError"){
            error = handledCastErrorDB(error);
        }else if(error.code == 11000){
            error = handledDuplicateErrorDB(error);
        }else if(error.name === "ValidationError"){
            error = handledValidationErrorDB(error);
        }else if(error.name === "JsonWebTokenError"){
            error = handledJWTTokenError(error);
        }else if(error.name === "TokenExpiredError"){
            error = handledTokenExiredError(error);
        }
        errorForProd(error,res);
    }else{
        errorForProd(err,res);
    }
}


