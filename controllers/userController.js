const multer = require('multer');
const sharp = require('sharp');
const AppError = require('../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

//Defining a middleware to upload a single image using multer

//storing the file in the file system
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const extension = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//   }
// });

//saving the uploaded image as a buffer
const multerStorage = multer.memoryStorage(); //buffer = req.file.buffer

//checking whether the uploaded file is an image
const multerFilter = (req, file, cb) => {
  console.log(file);
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files can be uploaded', 400), false);
  }
};

//photo - field name in the database
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

//resizing the images
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  console.log(req.file);
  if (!req.file) {
    return next();
  }

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(currentElement => {
    if (allowedFields.includes(currentElement)) {
      newObj[currentElement] = obj[currentElement];
    }
  });
  return newObj;
};

//Creating a middleware functionm for /me endpoint
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

//Route Handlers
//Updating user data by logged in user
exports.updateAccountDetails = catchAsync(async (req, res, next) => {
  //Create error if user tries to update password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for updating password. Please use /updateMyPassword for password updates',
        400
      )
    );
  }
  //Update user details. The user cannot update all the fields. can update only name and email
  const filteredBody = filterObj(req.body, 'email', 'name');
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }
  console.log(filteredBody);
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'Success',
    data: {
      user: updatedUser
    }
  });
});

exports.getAllUsers = factory.getAll(User);

exports.getUserById = factory.getOne(User);

exports.createNewUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined'
  });
};

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

//Delete User Account
exports.deleteAccount = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(200).json({
    status: 'Success',
    message: 'Your account has been successfully deactivated',
    data: null
  });
});
