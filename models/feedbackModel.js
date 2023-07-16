const mongoose = require("mongoose");

const { model, Schema } = mongoose;

const feedbackSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: {
        values: ["Feature", "UI", "UX", "Enhancement", "Bug"],
        message: "{VALUE} not supported as {PATH}",
      },
      required: [true, "Category is required"],
    },
    detail: {
      type: String,
      required: [true, "Detail is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["Planned", "Live", "In-Progress"],
        message: "{VALUE} not supported as {PATH}",
      },
      default: "Planned",
    },
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
    creator: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },
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
    toObject: {
      virtuals: true,
    },
  }
);

feedbackSchema.statics.getDocsNumByStatus = async function (category) {
  if (category === "All" || !category) category = /.*/gi; // match everything

  return await this.aggregate([
    {
      $match: { category: category },
    },
    {
      $group: {
        _id: "$status",
        appearance: { $sum: 1 },
      },
    },
  ]);
};

const Feedback = model("Feedback", feedbackSchema);

module.exports = Feedback;
