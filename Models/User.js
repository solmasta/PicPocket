const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
    },
    googleId: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    photos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Photo',
      },
    ],
    horses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Horse',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
