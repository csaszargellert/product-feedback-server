const bcrypt = require("bcryptjs");

const AppError = require("../helpers/AppError");
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const saltRounds = 12;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "{PATH} cannot be empty"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "{PATH} is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "{PATH} cannot be empty"],
      trim: true,
      minLength: [8, "{PATH} must be at least 8 chars long"],
      maxLength: [25, "Password must be maximum 25 chars long"],
      validate: {
        validator: function (value) {
          const error = [];
          if (!/[0-9]/.test(value)) {
            error.push(`${value} must contain number`);
          }
          if (!/[A-Z]/.test(value)) {
            error.push(`${value} must contain capital letter`);
          }
          if (!/[a-z]/.test(value)) {
            error.push(`${value} must contain capital letter`);
          }
          if (!/[$&+,:;=?@#|'<>\.^*()%!-]/.test(value)) {
            error.push(`${value} must contain special character`);
          }
          if (error.length) {
            throw new Error(error.join(", "));
          }
        },
      },
    },
    confirmPassword: {
      type: String,
      validate: {
        validator: function (value) {
          return this.password === value;
        },
        message: "Passwords do not match",
      },
      required: [true, "{PATH} cannot be empty"],
    },
    refreshToken: String,
    photo: String,
    feedbacks: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Feedback",
      },
    ],
    upvotes: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Upvote",
      },
    ],
    comments: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Comment",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_, returnedValue) {
        delete returnedValue._id;
        delete returnedValue.__v;
        delete returnedValue.createdAt;
        delete returnedValue.updatedAt;
        return returnedValue;
      },
    },
    toObject: { virtuals: true },
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(this.password, saltRounds);
  } catch (error) {
    next(new AppError(error.message, 500));
  }

  this.password = hashedPassword;
  this.confirmPassword = undefined;
  next();
});

userSchema.post("save", function (userDocument) {
  userDocument.password = undefined;
});

userSchema.methods.comparePassword = async function (
  hashedPassword,
  plainPassword
) {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

const User = model("User", userSchema);

module.exports = User;
