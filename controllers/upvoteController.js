const Upvote = require("../models/upvoteModel");
const User = require("../models/userModel");
const Feedback = require("../models/feedbackModel");
const AppError = require("../helpers/AppError");
const catchAsync = require("../helpers/catchAsync");

const feedbackLikes = catchAsync(async function (req, res) {
  const { feedbackId } = req.params;

  const feedback = await Feedback.findById(feedbackId);

  if (!feedback) throw new AppError("Feedback not found", 404);

  const user = req.user;

  const feedbackUpvote = await Upvote.findOne()
    .where({ user: user.id })
    .where({ feedback: feedbackId })
    .exec();

  // current user did not like this feedback yet => make like document
  if (!feedbackUpvote) {
    const newUpvote = new Upvote({ user: user.id, feedback: feedbackId });
    const savedUpvote = await newUpvote.save();

    await User.findByIdAndUpdate(user.id, {
      $push: { upvotes: savedUpvote.id },
    });

    await Feedback.findByIdAndUpdate(feedbackId, {
      $push: { upvotes: savedUpvote.id },
    });

    return res
      .status(200)
      .json({ success: true, data: "Like successfully added" });
  }

  // At this point we know that the user has already liked the feedback => remove likes from corresponding fields

  await User.findByIdAndUpdate(feedbackUpvote.user, {
    $pull: { upvotes: feedbackUpvote.id },
  });
  await Feedback.findByIdAndUpdate(feedbackUpvote.feedback, {
    $pull: { upvotes: feedbackUpvote.id },
  });

  await Upvote.findByIdAndDelete(feedbackUpvote.id);

  res.status(200).json({ success: true, data: "Like sucessfully removed" });
});

module.exports = { feedbackLikes };
