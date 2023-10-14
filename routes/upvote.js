const router = require("express").Router();
const catchAsync = require("../helpers/catchAsync");
const AppError = require("../helpers/AppError");
const Upvote = require("../models/upvoteModel");

router.get(
  "/all",
  catchAsync(async function (req, res, next) {
    const allUpvotes = await Upvote.find();
    res.status(200).json({ success: true, data: allUpvotes });
  })
);

module.exports = router;
