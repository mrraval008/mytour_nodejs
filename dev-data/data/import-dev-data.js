const fs = require('fs')
const mongoose = require('mongoose');
const dotenv= require('dotenv');
const Tour = require('./../../models/TourModel');
const User = require('./../../models/UserModel');
const Review = require('./../../models/ReviewModel');




dotenv.config({path:'./../../config.env'})

const DB = process.env.DB.replace('<PASSWORD>',process.env.DBPASSWORD)
mongoose.connect(DB,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false
}).then(con=>{
    console.log('DB connection succesful')
})

let tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8'));
let users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`,'utf-8'));
let review = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`,'utf-8'));


const importAllData = async ()=>{
    try{
        await Tour.create(tours);
        await User.create(users);
        await Review.create(review);
        console.log("Data succesfully Loaded...")
    }catch(err){
        console.log(err)
    }
    process.exit();
    
}

const deleteAllData = async ()=>{
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log("Data succesfully deleted...")
        
    }catch(err){
        console.log(err)
    }
    process.exit();
}


if(process.argv[2] == "--import"){
    importAllData()
}

if(process.argv[2] == "--delete"){
    deleteAllData()
}


console.log(process.argv)


//this is for delete and create all data
// To delete  => node .\import-dev-data --delete
// To create  => node .\import-dev-data --import





