const Comment = require("../models/commentModel");
const Feedback = require("../models/feedbackModel");
const AppError = require("../helpers/AppError");
const catchAsync = require("../helpers/catchAsync");

const createComment = catchAsync(async function (req, res, next) {
  const { content } = req.body;

  if (!content) throw new AppError("Comment cannot be empty", 400);

  const { feedbackId } = req.params;

  const feedback = await Feedback.findById(feedbackId);

  if (!feedback) throw new AppError("Feedback not found", 404);

  const user = req.user;

  const newComment = new Comment({
    content,
    user: user.id,
    feedback: feedbackId,
  });

  const savedComment = await newComment.save();

  user.comments.push(savedComment.id);
  await user.save({ validateModifiedOnly: true });

  feedback.comments.push(savedComment.id);
  await feedback.save();

  res.status(201).json({ success: true, data: savedComment });
});

const createReply = catchAsync(async function (req, res, next) {
  const { content } = req.body;

  if (!content) throw new AppError("Comment cannot be empty", 400);

  const { feedbackId, commentId } = req.params;

  const feedback = await Feedback.findById(feedbackId);

  if (!feedback) throw new AppError("Feedback not found", 404);

  const user = req.user;

  const updatedCommentWithReply = await Comment.findByIdAndUpdate(
    commentId,
    {
      $push: { replies: { content, user: user.id } },
    },
    { new: true }
  );

  if (!updatedCommentWithReply) throw new AppError("Comment not found", 404);

  const userReplies = updatedCommentWithReply.replies.filter(
    (reply) => reply.user.toString() === user.id
  );

  const currentUserLatestReply = userReplies[userReplies.length - 1];

  user.comments.push(currentUserLatestReply._id);
  await user.save({ validateModifiedOnly: true });

  res.status(201).json({ success: true, data: updatedCommentWithReply });
});

module.exports = {
  createComment,
  createReply,
};
