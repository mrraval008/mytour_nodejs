const Tour = require('./../models/TourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');


const aliasTopTour = (req, res, next)=>{
    req.limit = '5';
    req.sort = '-ratingsAverage,price';
    req.fields = 'name,price,summary,difficulty,ratingsAverage';
    next();
}

const getTourStats = async (req,res) =>{

    try{
        let stats = await Tour.aggregate([
            {
                $match: { ratingsAverage : { $gte : 4.5}}
            },
            {
                $group:{
                    // _id:null,
                    _id:'$difficulty',    //it will group by difficulty, one document for each difficulty level
                    // _id:{ $toUpper: '$difficulty' }
                    numTours:{$sum:1},
                    numRatings:{ $sum: '$ratingsQuantity'},
                    avgPrice:{ $avg : '$price'},
                    avgRatings: {$avg : '$ratingsAverage'},
                    minPrice:{$min : '$price'},
                    maxPrice:{$max : '$price'},
                }
            },
            {
                $sort:{avgPrice : 1}
            }
        ])

        res.status(200).json({
            status:"success",
            results:stats.length,
            data:{
                stats
            }
        })

    }catch(err){
        res.status(400).json({
            status:"error",
            data:{
                error:err
            }
        })
    }

}


const getMonthlyPlan = async(req,res)=>{
    const year = req.params.year * 1;
    try{
        let monthlyPlan = await Tour.aggregate([
            {
                $unwind: '$startDates'   //unwind will create seperate documents for each date as we have given startDates
            },
            {
                $match: {
                     startDates : { 
                         $gte:new Date(`${year}-01-01`),    //filter based on year
                         $lte: new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group:{
                    _id:{$month:"$startDates"},
                    numOfTours:{$sum:1}, 
                    tours: {$push: '$name'}    //for each docs push tour name
                }
            },
            {
                $addFields:{
                    month: '$_id'     //add field dynamically in resulted docs
                }
            },
            {
                $project:{
                    _id:0   //dont want _id in final results

                }
            },
            {
                $sort:{'numOfTours' : -1}
            },
            {
                $limit: 6
            }
        ])
        res.status(200).json({
            status:"success",
            results:monthlyPlan.length,
            data:{
                monthlyPlan
            }
        })
    }catch(err){
        res.status(400).json({
            status:"error",
            data:{
                error:err
            }
        })
    }  
}


const getAllTour = async (req,res)=>{
    try{
        //http://127.0.0.1:3000/api/v1/tours?duration=5&difficulty=easy
        // req.query= {duration:5 , difficulty:"easy"}

        //http://127.0.0.1:3000/api/v1/tours?duration[lte]=5&difficulty=easy
        // req.query = {duration:{lte:5} , difficulty:"easy"}  // we just need to replcae operator with mongodb operator

                 

        //One way to handled query string
        // let tourData = await Tour.find(req.query);

        //Second way
        // let tourData = await Tour.find()
        // .where('duration')
        // .equals(5)
        // .where('difficulty')
        // .equals('easy')


        // we just need to replcae operator with mongodb operator
        // let queryStr = JSON.stringify(req.query);

        // \b for exact match
        // (gte|gt|lte|lt) OR operation
        // /g to match all the occurance of that word
        //match = lte(matched word)
        // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g,match=>{
        //     return `$${match}`
        // })

        // queryStr = JSON.parse(queryStr)

        // let queryObj = { ...queryStr } // it will do hard copy of req.query obj.   ...req.query this will extract all key-value pair
        // let excludedFields = ['page','limit','sort','fields'];
        // excludedFields.forEach(field=>{
        //     delete queryObj[field];
        // })

        // let tourData = await Tour.find(queryObj);

        //in above approch it will wait till results come back,than we cant apply sort,limit and all things,
        // to solve that first build query and than execute it

        //BUILD Query
        // let query = Tour.find(queryObj);

        //SORTING
        // http://127.0.0.1:3000/api/v1/tours?sort=price ascending
        // http://127.0.0.1:3000/api/v1/tours?sort=-price descending (mongoose will take care)
        // req.query = {sort:price}

        // but what if we haqve two doc with same price, than we can add one more criterion to sort
        // http://127.0.0.1:3000/api/v1/tours?sort=price,ratingsAverage
        // req.query = {sort:price,ratingsAverage}
        //for mongodb need to pass like this  query.sort(price ratingsAverage) // need to replace comma with space

        // if(req.query.sort){
        //     let sortBy = req.query.sort.split(",").join(" ");
        //     query = query.sort(sortBy)
        // }else{
        //     //default sort
        //     query = query.sort('-createdAt');
        // }


        //Field Limiting
        // http://127.0.0.1:3000/api/v1/tours?fields=price,ratingsAverage
        // if(req.query.fields){
        //     const fields = req.query.fields.split(",").join(" ");
        //     query = query.select(fields);
        // }else{
        //     query = query.select('-__v'); //excluding __field , - is for excluding
        // }


        //Pagination
        // http://127.0.0.1:3000/api/v1/tours?page=2&limit=10
        // let page = req.query.page * 1 || 1 //    req.query.page * 1 converting string to number
        // let limit = req.query.limit * 1 || 100;
        // let skip = (page - 1) * limit
        // query = query.skip(skip).limit(limit);
       
        // if(req.query.page){
        //     const numOfTours = await Tour.countDocuments();   //it will return numbe of documents
        //     if(skip > numOfTours){
        //         throw new Error("This page does not exist")  // why throw error,when throw error it will move to catch statement 
        //     }
        // }


        let query = Tour.find();
        let features = new APIFeatures(query,req.query).filter().sort().limitFields().pagination();
        
        //Execute Query
        let tourData = await features.query;
        res.status(200).json({
            status:"success",
            results:tourData.length,
            data:{
                tour:tourData
            }
        })
    }catch(err){
        res.status(400).json({
            status:"error",
            data:{
                error:err
            }
        })
    }
}



const createTour = catchAsync(async (req,res,next)=>{
    let newTour = await Tour.create(req.body);
    res.status(201).json({
        status:"success",
        message:{
            data:newTour
        }
    })
})
// const createTour = async (req,res,next)=>{
//     console.log("create tour");

//     //one approch to save

//     // const testTour = new Tour({
//     //     "name":"A sea safari 11",
//     //     "price":433,
//     //     "rating":4.5,
//     //     // "extra":43  //it will not save as its not there in schema
//     // })
//     // console.log(testTour)
//     //testTour is instance of document,we will have diff methods on it
//     // testTour.save().then(doc=>{
//     //     console.log(doc)
//     // }).catch(err=>{
//     //     console.log(err)
//     // })

//     //another approch to save
//     try{
//         let newTour = await Tour.create(req.body);
//          //201 for create
//         res.status(201).json({
//             status:"success",
//             message:{
//                 data:newTour
//             }
//         })
//     }catch(err){
//         res.status(400).json({
//             status:"success",
//             message:{
//                 data:err
//             }
//         })
//     }
   
// }

const getTour = async (req,res)=>{
  
    try{
        let tourData = await Tour.findById(req.params.id);
        res.status(200).json({
            status:"success",
            data:{
                tour:tourData
            }
        })
    }catch(err){
        res.status(404).json({
            status:"error",
            data:{
                error:err
            }
        })
    }
}

const updateTour = async (req,res)=>{

    try{
        // syntax Tour.updateOne({filters},{$set:{updated docs}})
        // let tour = await Tour.updateOne({_id:req.params.id} , {$set:req.body})

        // or 

        let updatedTour = await Tour.findByIdAndUpdate(req.params.id,req.body,{
            new:true,
            runValidators:true
        })
        res.status(400).json({
            status:"success",
            data:{
                tour:updatedTour
            }
        })
    }catch(err){
        res.status(400).json({
            status:"error",
            data:{
                "error":err
            }
        })
    }
 
}

const deleteTour = async (req,res)=>{

    try{
        let deletedTour = await Tour.findByIdAndDelete(req.params.id);
        res.status(201).json({
            status:"success",
            data:{
                tour:deletedTour
            }
        })
    }catch(err){
        res.status(400).json({
            status:"error",
            data:{
                error:err
            }
        })
    }
   
}

const checkData = (req,res,next)=>{
    if(req.body){
        if(!req.body.name || !req.body.price){
            return res.status(404).json({
                status:"error",
                message:"Name or Price Unavailible"
            })
        }
    }
    next();
}


module.exports =  {
    getAllTour,
    createTour,
    getTour,
    updateTour,
    deleteTour,
    checkData,
    aliasTopTour,
    getTourStats,
    getMonthlyPlan
}