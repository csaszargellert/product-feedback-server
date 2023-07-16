const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const upvoteSchema = new Schema(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },
    feedback: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Feedback",
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform: function (_, returnedUpvote) {
        delete returnedUpvote._id;
        delete returnedUpvote.__v;
        return returnedUpvote;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

const Upvote = model("Upvote", upvoteSchema);

module.exports = Upvote;
