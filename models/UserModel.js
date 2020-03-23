const crypto = require('crypto');

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const catchAsync = require('./../utils/catchAsync');
let slugify = require('slugify');


let userSchema = new mongoose.Schema({
    name:{
        type:String,
        require:[true,"User must have a Name"],
        trim:true
    },
    email:{
        type:String,
        require:[true,"User must have a Email"],
        unique:true,
        lowercase:true,   //it will convert email into lowercase
        trim:true,
        validate:[validator.isEmail,'Please provide valid email']
    },
    photo:{
        type:String,
        trim:true,
        default: "default.jpg"
    },
    password:{
        type:String,
        require:[true,"Please provide password"],
        minlenght:8,
        select:false
    },
    role:{
        type:String,
        enum:["admin","user","guide","lead-guide"],
        default:"user"
    },
    passwordConfirm:{
        type:String,
        require:[true,"Please confirm password"],
        validate:{
            //this will only run on save and create method
            validator:function(val){    //here we use function not arrow function as we need this inside function
                return this.password === val;
            },
            message: 'Confirmed Password should be same'
        }
    },
    passwordChangedAt:{
        type:Date
    },
    passwordResetToken:{
        type:String
    },
    passwordResetExpire:{
        type:Date
    },
    active:{
        type:Boolean,
        default:true
    },
    slug: String
})


userSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next();
  });

// document middleware
userSchema.pre('save', async function(next){
    //only run this function if password was modified
    if(!this.isModified('password')) return next();
    //Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password,12);

    //delete password Confirm
    this.passwordConfirm = undefined;

    next();
})

userSchema.pre('save',function(next){
    //only run this function if password was modified or its new
    if(!this.isModified('password') || this.isNew) return next();
    
    this.passwordChangedAt = Date.now() - 1000;

    next();
})


// query middleware
userSchema.pre(/^find/,function(next){
    this.find({active:{$ne:false}})
    next();
})


userSchema.methods.correctPassword = async function(candidatePassword,userPassword){
    return await bcrypt.compare(candidatePassword,userPassword);
}

userSchema.methods.isUserhasChangePassword = function(tokenIssueTimestamp){
    if(this.passwordChangedAt){
        let passChangeTimeStamp = parseInt((this.passwordChangedAt.getTime() / 1000),10);
        if(tokenIssueTimestamp < passChangeTimeStamp){
            return true;
        }
    }
    return false;
}

userSchema.methods.createPasswordResetToken = function(){
    //generate 32 chars token
    let token = crypto.randomBytes(32).toString("hex");

    let encryptedToken = crypto.createHash("sha256").update(token).digest("hex");

    this.passwordResetToken = encryptedToken;

    //set password expory after 10 minutes
    this.passwordResetExpire = Date.now() + 10 * 60 * 1000;

    return token;
}

let User = new mongoose.model("User",userSchema);


module.exports = User;
