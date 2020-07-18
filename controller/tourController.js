const multer = require('multer');
const sharp = require('sharp');

const Tour = require('./../models/TourModel');

// const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const factory = require('./factoryController');


const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true)
    } else {
        cb(new AppError("Not an Image!,Please upload only images.", 400), false);
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})

const uploadTourImages = upload.fields([
    { "name": 'imageCover', maxCount: 1 },
    { "name": 'images', maxCount: 3 }
])


const resizeTourImages = catchAsync(async (req, res, next) => {

    if (req.files && req.files.imageCover) {
        req.body.imageCover = `tour-${req.params.id}-${Date.now()}.jpeg`;
        await sharp(req.files["imageCover"][0].buffer)
            .resize(2000, 1333)   //to make non-square image to square image
            .toFormat("jpeg")
            .jpeg({ quality: 90 })
            .toFile(`D:/HTML_Practice/Apps/Tour_App/tour-app/src/assets/img/tours/${req.body.imageCover}`)
    }
    if(req.files && req.files.images){
        req.body.images = []
        await Promise.all(req.files.images.map(async (file, i) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
    
            await sharp(file.buffer)
                .resize(2000, 1333)   //to make non-square image to square image
                .toFormat("jpeg")
                .jpeg({ quality: 90 })
                .toFile(`D:/HTML_Practice/Apps/Tour_App/tour-app/src/assets/img/tours/${filename}`)
            req.body.images.push(filename)
        }))
    }
 

    next();

})


const aliasTopTour = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,summary,difficulty,ratingsAverage';
    next();
}

const getTourStats = catchAsync(async (req, res, next) => {   //catchasync function is used to try catch block used multiple place/now with catchasync every thing is at one place

    let stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: '$difficulty',   //it will give three docs as we have three dificulties i.e. easy medium,difficult
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgPrice: { $avg: '$price' },
                avgRatings: { $avg: '$ratingsAverage' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            }
        },
        {
            $sort: { avgPrice: 1 }
        }
    ])

    res.status(200).json({
        status: "success",
        results: stats.length,
        data: {
            stats
        }
    })
})


const getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;
    let monthlyPlan = await Tour.aggregate([
        {
            $unwind: '$startDates'     //badhi dates na alag alag doument bani jase, ex. [date1,date2] than 2 doc banse 
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: "$startDates" },
                numOfTours: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: {
                month: '$_id'
            }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { 'numOfTours': -1 }
        },
        {
            $limit: 6
        }
    ])
    res.status(200).json({
        status: "success",
        results: monthlyPlan.length,
        data: {
            monthlyPlan
        }
    })
})


const getAllTour = factory.getAll(Tour);
// catchAsync(async (req,res,next) =>{
//     let query = Tour.find();
//     let features = new APIFeatures(query,req.query).filter().sort().limitFields().pagination();

//     let tourData = await features.query;
//     res.status(200).json({
//         status:"success",
//         results:tourData.length,
//         data:{
//             tour:tourData
//         }
//     })
// })


const getTour = factory.getOne(Tour, { path: 'reviews' })
// catchAsync(async (req,res,next)=>{
//     let tourData = await Tour.findById(req.params.id).populate('reviews');   //virtaul populate review
//     if(!tourData){
//         let err = new AppError(`Tour not found for this id - ${req.params.id}`,404)
//         return next(err);   //It will  jump to global error handle middleware
//     }
//     res.status(200).json({
//         status:"success",
//         data:{
//             tour:tourData
//         }
//     })
// })

const createTour = factory.createOne(Tour)



const updateTour = factory.updateOne(Tour);
// const updateTour = catchAsync(async (req,res,next)=>{
//     let updatedTour = await Tour.findByIdAndUpdate(req.params.id,req.body,{
//         new:true,
//         runValidators:true
//     })

//     if(!updatedTour){
//         let err = new AppError(`Tour not found for this id - ${req.params.id}`,"404")
//         return next(err);   //It will  jump to global error handle middleware
//     }

//     res.status(400).json({
//         status:"success",
//         data:{
//             tour:updatedTour
//         }
//     })
// })

const deleteTour = factory.deleteOne(Tour);

const checkData = (req, res, next) => {
    if (req.body) {
        if (!req.body.name || !req.body.price) {
            return res.status(404).json({
                status: "error",
                message: "Name or Price Unavailible"
            })
        }
    }
    next();
}

const getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");

    if (!lat || !lng) {
        return next(new AppError("Please provide latitide and longitude "), 400);
    }
    let radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

    let tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } });

    res.status(200).json({
        status: "success",
        results: tours.length,
        data: {
            data: tours
        }
    });
})

const getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");

    if (!lat || !lng) {
        return next(new AppError("Please provide latitide and longitude "), 400);
    }

    const multiplier = unit === "mi" ? 0.000611371 : 0.001;

    let distances = await Tour.aggregate([
        {
            $geoNear: {                              // for calculation it will take indexes which has 2dsphere index,in our case startLocation has
                // as its the only index,no need to define here
                //if we have multiple 2dsphere indexes,we need to define here which index you want to use using  "keys" 

                near: {
                    type: "Point",
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: "distance",     //it will create and store "distance" field in all tour docs calculated based on lat and longitude           
                distanceMultiplier: multiplier     // we will get distance in meter ,we need to convert in to kilometer ,so all distance will devide by 1000
            }

        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ])

    res.status(200).json({
        status: "success",
        results: distances.length,
        data: {
            data: distances
        }
    });
})



module.exports = {
    getAllTour,
    createTour,
    getTour,
    updateTour,
    deleteTour,
    checkData,
    aliasTopTour,
    getTourStats,
    getMonthlyPlan,
    getToursWithin,
    getDistances,
    uploadTourImages,
    resizeTourImages
}