const mongoose = require('mongoose');
const dotenv= require('dotenv');

//Handled uncaught exception
// ex console.log(randomvariable) where randomvariable is not defined

process.on('uncaughtException',(err)=>{
    console.log(err.name,err.message);
    console.log('UNCAUGTH EXCEPTION, SHUTTING DOWN...')
    process.exit(1); 
})

//It will set all config.env varaible to Nodejs Environment Varialble
dotenv.config({path:'./config.env'})

//connect to MongoDB
const DB = process.env.DB.replace('<PASSWORD>',process.env.DBPASSWORD)
mongoose.connect(DB,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false
}).then(con=>{
    // console.log(con.connection);
    console.log('DB connection succesful')
})

const app = require('./app')

// console.log(process.env)
// console.log(process.env["NODE_ENV"])
//process is accesssible in any file
port = process.env.PORT || 3000
const server = app.listen(port,()=>{
    console.log(`listening at ${port}`)
})
//We can set environmet variable when running  nodemon server.js in command prompt
//run NODE_ENV="development" x=23 nodemon server.js and do console.log(process.env)




//Handle Unhanlded promise rejection outside express
// INSIDE EXPRESS WE HAVE GLOBAL ERROR HANDLER CONTROLLER //errorController.js
//ex. mongodb connection error bacause of wrong password

process.on('unhandledRejection',(err)=>{
    console.log(err.name,err.message);
    console.log('UNHANDLED REJECTION, SHUTTING DOWN...')
    // process.exit(1);  //It will abort all request immedialtely //We need to do gracefully
    //so first close server and than process.exit(1)
    server.close(()=>{
        process.exit(1); 
    });
})




