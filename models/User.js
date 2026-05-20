const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Нэрээ оруулна уу'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Овогоо оруулна уу'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Имэйл хаягаа оруулна уу'],
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, 'Нууц үгээ оруулна уу'],
      minlength: 4,
      select: false
    },
    savedPlaces: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
      }
    ],
    lastLogin: {
      type: Date
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);