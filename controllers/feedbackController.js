const Feedback = require("../models/feedbackModel");
const Upvote = require("../models/upvoteModel");
const User = require("../models/userModel");
const Comment = require("../models/commentModel");
const catchAsync = require("../helpers/catchAsync");
const AppError = require("../helpers/AppError");

const getAllFeedbacks = catchAsync(async function (req, res, next) {
  const { category } = req.query;

  let feedbackQuery = Feedback.find();

  if (category !== "All") {
    feedbackQuery = feedbackQuery.where("category", category);
  }
  const feedbacks = await feedbackQuery.exec();

  const statuses = await Feedback.getDocsNumByStatus(category);

  res.status(200).json({ success: true, data: { feedbacks, statuses } });
});

const addFeedback = catchAsync(async function (req, res, next) {
  const { title, category, detail } = req.body;
  const user = req.user;

  const newFeedback = new Feedback({
    title,
    category,
    detail,
    creator: user.id,
  });

  const savedFeedback = await newFeedback.save();

  user.feedbacks.push(savedFeedback.id);
  await user.save({ validateModifiedOnly: true });

  res.status(201).json({ success: true, data: savedFeedback });
});

const editFeedback = catchAsync(async function (req, res, next) {
  const { feedbackId } = req.params;
  const { title, detail, status, category } = req.body;
  const user = req.user;

  const isFeedbackCreatedByUser = user.feedbacks.includes(feedbackId);

  if (!isFeedbackCreatedByUser)
    throw new AppError("Cannot change this feedback", 403);

  const updateObj = {
    detail,
    status,
    category,
    title,
  };

  const foundDoc = await Feedback.findByIdAndUpdate(feedbackId, updateObj, {
    new: true,
    runValidators: true,
  });

  if (!foundDoc) throw new AppError("Could not find document", 404);

  res.status(200).json({ success: true, data: "Update document successfully" });
});

const getFeedback = catchAsync(async function (req, res, next) {
  const { feedbackId } = req.params;

  const foundFeedback = await Feedback.findById(feedbackId)
    .select("title detail status category creator comments upvotes")
    .populate({
      path: "comments",
      select: "content replies user",
      populate: { path: "user replies.user", select: "photo username" },
    });

  if (!foundFeedback) throw new AppError("Could not find document", 404);

  res.status(200).json({ success: true, data: foundFeedback });
});

const deleteFeedback = catchAsync(async function (req, res, next) {
  const { feedbackId } = req.params;
  const user = req.user;

  // Check if the user who wants to delete this feedback is actually the user who has created the feedback itself
  const feedbackIndex = user.feedbacks.findIndex(
    (feedbackObjectId) => feedbackObjectId.toString() === feedbackId
  );
  // If the user is not the corresponding user to this feedback, then throw an error
  if (feedbackIndex === -1)
    throw new AppError("User cannot delete this feedback", 400);

  // From this point, we know that the user is the relevant user who has created the feedback

  // Check if the feedback still exists or the id is not tampered
  const feedback = await Feedback.findById(feedbackId);

  // If feedback is not found in the database, then throw an error
  if (!feedback) throw new AppError("Could not find document", 404);

  // Feedback contains: creator, comments and upvotes
  // When deleting a feedback, we need to make sure that we delete the corresponding values
  // 1. Delete all the comments
  // 2. Delete all the upvotes
  // 3. Delete feedback
  // 4. Delete comments and upvotes from user
  // 5. Delete feedback id from the feedbacks array of user who has created the feedback itself

  // 0. Get hold of the reply ids
  const feedbackWithPopulatedComments = await feedback.populate({
    path: "comments",
    select: "replies",
  });

  const replyIds = feedbackWithPopulatedComments.comments.reduce(
    (prevValue, comment) => {
      const indCommentreplyIds = comment.replies.map((reply) => reply._id);

      return [...prevValue, ...indCommentreplyIds];
    },
    []
  );

  // 1.
  const commentIds = feedback.comments.map((comment) => comment._id);
  await Comment.deleteMany({ _id: { $in: commentIds } });

  // 2.
  const upvoteIds = feedback.upvotes;
  await Upvote.deleteMany({ _id: { $in: upvoteIds } });

  // 3.
  await Feedback.deleteOne({ _id: feedbackId });

  // 4.
  const allComments = [...commentIds, ...replyIds];

  await User.updateMany(
    {
      $or: [
        { comments: { $in: allComments } },
        { upvotes: { $in: upvoteIds } },
      ],
    },
    {
      $pull: {
        comments: { $in: allComments },
        upvotes: { $in: upvoteIds },
      },
    }
  );

  // 5.
  await User.updateOne(
    { _id: user.id },
    {
      $pull: { feedbacks: feedback.id },
    }
  );

  res.status(200).json({ success: true, data: "Delete document successfully" });
});

module.exports = {
  addFeedback,
  editFeedback,
  getFeedback,
  deleteFeedback,
  getAllFeedbacks,
};
