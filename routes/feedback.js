const router = require("express").Router();
const {
  getAllFeedbacks,
  addFeedback,
  editFeedback,
  getFeedback,
  deleteFeedback,
} = require("../controllers/feedbackController");
const {
  createComment,
  createReply,
} = require("../controllers/commentController");
const { feedbackLikes } = require("../controllers/upvoteController");
const { authorizeUser } = require("../controllers/authController");

router.get("/all", getAllFeedbacks);
router.get("/:feedbackId", getFeedback);

router.use(authorizeUser);

router.post("/add", addFeedback);

router
  .route("/edit/:feedbackId")
  .get(getFeedback)
  .put(editFeedback)
  .delete(deleteFeedback);

router.post("/:feedbackId/comment", createComment);
router.post("/:feedbackId/comment/:commentId/reply", createReply);
router.post("/:feedbackId/upvote", feedbackLikes);

module.exports = router;
