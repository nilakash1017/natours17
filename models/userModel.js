const mongoose = require('mongoose');
const validator = require('validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name']
  },
  email: {
    type: String,
    required: [true, 'Please enter your email id'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email id']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'lead-guide', 'tour-lead', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please enter your password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(el) {
        return el === this.password;
      },
      message: `Oops! Passwords don't match`
    }
  },
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
});

//Password Encryption
userSchema.pre('save', async function(next) {
  //if the password is not modified, enc wont happen. Run the function only when the password was modified
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

//Setting the password Changed at
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//Inactive users wont be displayed when get all users route is hit. Implemented by Query Middleware
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

//Password bcrypt library function
userSchema.methods.correctPassword = async (enteredPassword, userPassword) => {
  return await bcrypt.compare(enteredPassword, userPassword);
};

//If user changes the password
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 100,
      10
    );
    // console.log(JWTTimestamp, changedTimestamp);
    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log(resetToken, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //expires after 10 min

  //return the plain text token and send that to the user via email
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
