const catchAsync = require('../utils/catchAsync');
const Users = require('../models/userModel');
const AppError = require('../utils/appError');
const factory = require('./handleFactory');
const user = require('../models/userModel');

function filter(obj, ...items) {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (items.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
}

exports.getMe = (req,res,next) =>{
  req.params.id = req.user.id;
  next();
}


exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.confirmPassword) {
    return next(new AppError('this action is prohibated here. pls visit password change',400));
  }
  const filteredBody = filter(req.body, 'email', 'name');
  let updateUser = await Users.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators:true
  });
  console.log(updateUser);

  res.status(200).json({
    status:'succes',
    user:{
      updateUser
    }
  })

  next();

})


exports.deleteMe = async(req,res,next) =>{
  let activatedUser = await Users.findByIdAndUpdate(req.user.id,{active:false});
  res.status(204).json({
    null:null
  })
  next();
}



exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!and not will pls use sign up instead.'
  });
};

exports.getUser = factory.getOne(Users);
exports.getAllUsers =factory.getAll(Users);
// exports.createUser = factory.createOne(Users);
exports.updateUser = factory.updateOne(Users);
exports.deleteUser = factory.deleteOne(Users);