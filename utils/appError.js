
class AppError extends Error{
    constructor(message,statusCode){
        super(message); //it will create property called 'message'
        this.statusCode = statusCode;
        this.isOperational = true;
        this.status = `${statusCode}`.startsWith("4") ? "fail":"error"   // 404 ,401 indiactes fail to find, 500,501 indiactes errr in finding
        Error.captureStackTrace(this,this.constructor);  //need to check why this is, it will add stack property to this class's instance
    }
}   

module.exports = AppError;