const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');



const deleteOne = Model => catchAsync(async (req,res,next)=>{
    let doc = await Model.findByIdAndDelete(req.params.id);

    if(!doc){
        let err = new AppError(`doc not found for this id - ${req.params.id}`,"404")
        return next(err);   //It will  jump to global error handle middleware
    }


    res.status(201).json({
        status:"success",
        data:{
           data:null
        }
    })
})


const updateOne = Model => catchAsync(async (req,res,next)=>{
   // console.log("Update Tour log",req.params.id,req.body)
        let updatedDoc = "";
        if(req.body.images){
            updatedDoc = await Model.findByIdAndUpdate(req.params.id,{ $push: { "images": req.body.images}})
        }else{
            updatedDoc = await Model.findByIdAndUpdate(req.params.id,req.body,{
                new:true,
                // runValidators:true    will not work in update as "this" in validator is refer to window object , not current document, I have handled in front end
            })
        }
     
        if(!updatedDoc){
            let err = new appError(`Doc not found for this id - ${req.params.id}`,"404")
            return next(err);   //It will  jump to global error handle middleware
        }
    
        res.status(200).json({
            status:"success",
            data:{
                data:updatedDoc
             }
        })
    })

const createOne = Model => catchAsync(async (req,res,next)=>{
    let doc = await Model.create(req.body);
    res.status(201).json({
        status:"success",
        data:{
            data:doc
         }
    })
})


const getOne = (Model,populateOption)=> catchAsync(async (req,res,next)=>{
    console.log("get bookings 1")
    let query = Model.findById(req.params.id);
    if(populateOption){
        query.populate(populateOption);
    }
    let doc = await query;   //virtaul populate review
    if(!doc){
        let err = new appError(`doc not found for this id - ${req.params.id}`,404)
        return next(err);   //It will  jump to global error handle middleware
    }
    res.status(200).json({
        status:"success",
        data:{
            user:req.user,
            data:doc
         }
    })
})

const getAll = (Model)=>catchAsync(async (req,res,next) =>{
    console.log("get bookings")

    console.log(req.query)
    //To handle nested route
    let filter = {}
    if(req.params.tourId){
        filter = {tour:req.params.tourId}
    }
    // if(req.params.userId){
    //     filter = {user:req.params.userId}
    // }
    let query = Model.find(filter);
   
    
    let features = new APIFeatures(query,req.query).filter().sort().limitFields().pagination();
    
    let docs = await features.query;

    // let docs = await features.query.explain();   for query statstics
    res.status(200).json({
        status:"success",
        results:docs.length,
        data:{
            user:req.user,
            data:docs
         }
    })
})

module.exports = {
    deleteOne,
    updateOne,
    createOne,
    getOne,
    getAll
}