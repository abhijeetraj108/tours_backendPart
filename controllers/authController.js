const crypto = require('crypto')
const { promisify } = require('util');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
// const user = require('../models/userModel');
const sendEmail = require('../utils/email')


const singtoken = async (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES
    })
}


exports.signup = catchAsync(async (req, res) => {
    // const newdata = await User.create(req.body);
    // const user = User.findById(req,user.id);
    const newuser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    });

    //sending cookies

    const token = await singtoken(newuser._id)

    const cookieOptions = {
        Expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
        // expires: new Date(
        //     Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        //   ),
        httpOnly: true
    };
    if (process.env_NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);
    newuser.password=undefined


    res.status(200).json({
        status: 'succes',
        token,
        data: {
            newuser
        }
    })
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body
    const user = await User.findOne({ email }).select('+password');

    //check if emai is present or not
    if (!email || !password) {
        return next(new AppError('please enter emai and password both', 400));
    }

    //check if the value entered is matching or not
    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('incorrect email or password', 401));
    }

    //sending response---------
    token = await singtoken(user._id)

    // const token = await singtoken(newuser._id)

    const cookieOptions = {
        Expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
        // expires: new Date(
        //     Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        //   ),
        httpOnly: true
    };
    if (process.env_NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);
    // newuser.password=undefined



    res.status(200).json({
        status: 'sucess',
        token,
        data: {
            user
        }
    })
});

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    res.status(200).json({ status: 'success' });
  };

exports.protect = catchAsync(async (req, res, next) => {
    let token;

    //  1) getting token and check if its true
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = await req.headers.authorization.split(' ')[1]
    }else if(req.cookies.jwt){
        token = req.cookies.jwt
    }

    if (!(token)) {
        return next(new AppError('please login to get the credentials', 401))
    }

    //cheking for the token
    let decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // try {
    //     decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //     console.log(decode);
    // } catch (err) {
    //     return next(new AppError(err));
    // }
    //check if the user exists
    let currentUser = await User.findById(decode.id);
    if (!currentUser) {
        return next(new AppError('user can not be find', 401));
    }

    // 4) check if the paasword is being chsnged

    if (currentUser.changedPasswordAfter(decode.iat)) {
        return next(
            new AppError('User recently changed password! Please log in again.', 401)
        );
    }

    req.user = currentUser;
    next()
})

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
      try {
        // 1) verify token
        const decoded = await promisify(jwt.verify)(
          req.cookies.jwt,
          process.env.JWT_SECRET
        );
  
        // 2) Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
          return next();
        }
  
        // 3) Check if user changed password after the token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
          return next();
        }
  
        // THERE IS A LOGGED IN USER
        res.locals.user = currentUser;
        return next();
      } catch (err) {
        return next();
      }
    }
    next();
  };
  

exports.toRestrict = (...roles) => {
    return (req, res, next) => {
        if (!(roles.includes(req.user.role))) {
            return next(new AppError('you are not permited for taking this action', 403));
        }
        next();
    }
}

exports.forgetPassword = async (req, res, next) => {
    //get the user with the email-----
    let getUser = await User.findOne({ email: req.body.email });
    if (!getUser) {
        return next(new AppError('no user exists with this user id', 402));
    }
    //reset the password-------------------
    const resetToken = await getUser.createPassword();
    await getUser.save({ validateBeforeSave: false })

    //send the email
    // const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/forgetPassword/${resetToken}`;
    const resetUrl = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email!`

    try {
        await sendEmail({
            email: getUser.email,
            subject: 'this email will be valkid for 5 minute only. verify!!',
            message
        });

        res.status(200).json({
            status: 'succes',
            message: 'pls verify the sent password'
        });
    } catch (error) {
        this.resetPassword = undefined
        this.expireResetPassword = undefined
        await getUser.save({ validateBeforeSave: false })

        return next(
            new AppError('There was an error sending the email. Try again later!'),
            500
        );
    }

    next();
}

exports.resetPassword = async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    //   const hashedToken  = crypto.createHash('sha256').update(req.paramas.token).disgest('hex');
    //   const user = await User.findOne({passwordResetToken : hashedToken,passwordResetTokenExpires:{$gt:Date.now()}});
    const user = await User.findOne({
        resetPassword: hashedToken,
        expireResetPassword: { $gt: Date.now() }
    });

    if (!user) {
        next(new AppError('token has been expired!'));
    }

    // 2) If token has not expired, and there is user, set the new password
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT
    const token = await singtoken(user._id)
    res.status(200).json({
        status: 'succes',
        token
    })
}

exports.updatePassword = async (req, res, next) => {
    // get the user-------------
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
        next(new AppError('pls enter the corerct credentials'));
    }

    user.password = req.body.password,
        user.confirmPassword = req.body.confirmPassword
    await user.save()

    const token = await singtoken(user._id)
    res.status(200).json({
        status: 'succes',
        token
    })
    next()
}

