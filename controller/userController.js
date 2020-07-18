const multer = require('multer');
const sharp = require('sharp');


const User = require('./../models/UserModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./factoryController');
const AppError = require('./../utils/appError')

// const multerStorage = multer.diskStorage({
//     destination:(req,file,cb) =>{
//       cb(null,"D:/HTML_Practice/Apps/Tour_App/tour-app/src/assets/img/users")
//     },
//     filename: (req,file,cb)=>{
//       // user-userid-current timestamp.jpeg  //just to make sure no duplicate file will upload
//       const extension = file.mimetype.split("/")[1];
//       cb(null,`user-${req.user.id}-${Date.now()}.${extension}`);
//     }
// })

//For image processing(using sharp) we need to store file in memory ,so commenting diskStorage and doing memoryStorage.
const multerStorage = multer.memoryStorage();

const multerFilter = (req,file,cb)=>{
    if(file.mimetype.startsWith("image")){
      cb(null,true)
    }else{
      cb(new AppError("Not an Image!,Please upload only images.",400),false);
    }
}

const upload = multer({
  storage:multerStorage,
  fileFilter:multerFilter
})


const resizeUserPhoto = catchAsync( async (req,res,next)=>{
  if(!req.file){
    return next();
  }
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500,500)   //to make non-square image to square image
    .toFormat("jpeg")
    .jpeg({quality:90})
    .toFile(`D:/HTML_Practice/Apps/Tour_App/tour-app/src/assets/img/users/${req.file.filename}`)

    next();

})



const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const getAllUser =  factory.getAll(User);
// catchAsync(async (req,res)=>{
//     let userData = await  User.find();
//     res.status(200).json({
//         status:"success",
//         results:userData.length,
//         data:{
//             user:userData
//         }
//     })
// });

const createUser = (req,res)=>{
    res.status(500).json({
        status:"error",
        message:"Route is not defined yet"
    })
}
const updateMe = catchAsync(async (req, res, next) => {
  console.log("filteredBody",req.body)
  
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(  
        new AppError(
          'This route is not for password updates. Please use /updateMyPassword.',
          400
        )
      );
    }

    // 2) Filtered out unwanted fields names that are not allowed to be updated
    // const filteredBody = filterObj(req.body, 'name', 'email');
    const filteredBody = req.body


    //to upload photo
    if(req.file){
      filteredBody.photo = req.file.filename;
    }

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true
    });
  
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  });
  
const deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });
  
    res.status(204).json({
      status: 'success',
      data: null
    });
  });

const getMe = (req,res,next)=>{
    req.params.id = req.user.id;
    next();
}
const getUser = factory.getOne(User);

const updateUser =  factory.updateOne(User);

const deleteUser = factory.deleteOne(User);


const uploadUserPhoto = upload.single('photo');


module.exports =  {
    getAllUser,
    createUser,
    getUser,
    updateUser,
    deleteUser,
    updateMe,
    deleteMe,
    getMe,
    uploadUserPhoto,
    resizeUserPhoto
}