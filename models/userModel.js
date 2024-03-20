const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    active:{
      type:Boolean,
      default:true
    },
    photo: String,
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
      },
    password: {
        type: String,
        required: [true, 'user must hav ea password'],
        minlength: 8,
        select: false
    },
    confirmPassword: {
        type: String,
        required: [true, 'user id must have a pasword'],
        validate: {
            validator: function (el) {
                return this.password === el //return true or false after matching  this.confirmPassword
            },
            message: "passwor did not match"
        }
    },
    passwordChangedAt: Date,
    resetPassword:String,
    expireResetPassword:Date,
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return

    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined

    next();
})

userSchema.methods.correctPassword = async (candidatepassword, userpassword) => {
    // return await bcrypt.hash(candidatepassword,12) === userpassword;
    return await bcrypt.compare(candidatepassword, userpassword)
}



userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
          this.passwordChangedAt.getTime() / 1000,
        10
      );
  
      return JWTTimestamp < changedTimestamp;
    }
  
    // False means NOT changed
    return false;
  };


  userSchema.methods.createPassword = async function () {
      // this.resetPassword = await bcrypt.hash(resetToken,12);
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetPassword = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

    console.log(resetToken,this.resetPassword);

    this.expireResetPassword = Date.now()+ 10*60*1000;

    return resetToken;
  }

  userSchema.pre('save',function(next){
    if(!(this.isModified('password')||this.isNew)) return next();

    this.passwordChangedAt = Date.now()-1000;
    next()
  })

  userSchema.pre(/^find/,function(next){
    this.find({active:{$ne:false}});
    next()
  })


const user = mongoose.model('user', userSchema);

module.exports = user;