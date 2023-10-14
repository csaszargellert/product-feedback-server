const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const replySchema = new Schema(
  {
    replyToWhom: String,
    content: String,
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },
  },
  {
    toJSON: {
      virtuals: true,
      transform: function (_, returnedComment) {
        delete returnedComment._id;
        delete returnedComment.__v;

        return returnedComment;
      },
    },
    toObject: { virtuals: true },
  }
);

const commentSchema = new Schema(
  {
    content: String,
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },
    feedback: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Feedback",
    },
    replies: [replySchema],
  },
  {
    toJSON: {
      virtuals: true,
      transform: function (_, returnedComment) {
        delete returnedComment._id;
        delete returnedComment.__v;

        return returnedComment;
      },
    },
    toObject: { virtuals: true },
  }
);

const Comment = model("Comment", commentSchema);

module.exports = Comment;
