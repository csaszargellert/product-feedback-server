const User = require("../models/userModel");
const AppError = require("../helpers/AppError");
const catchAsync = require("../helpers/catchAsync");
// const { generateToken, validateToken } = require("../helpers/tokens");
const jwt = require("jsonwebtoken");

const register = catchAsync(async function (req, res, next) {
  const { username, password, confirmPassword, name } = req.body;
  const newUser = new User({
    username,
    password,
    confirmPassword,
    name,
  });

  const savedUser = await newUser.save();

  res.status(201).json({ success: true, data: savedUser });
});

const login = catchAsync(async function (req, res, next) {
  const { username, password } = req.body;
  // CHECK IF THE USER HAS PROVIDED THE USERNAME AND PASSWORD
  if (!username || !password)
    throw new AppError("Please provide username or password", 400);

  const foundUser = await User.findOne({ username: username });

  // CHECK IF THE PROVIDED USERNAME AGAINST THE USERNAMES IN THE DB
  if (!foundUser) throw new AppError("User not found", 404);

  const match = await foundUser.comparePassword(foundUser.password, password);

  // CHECK IF THE PROVIDED PASSWORD IS THE SAME AS THE ONE SAVED INTO THE DB
  if (!match) throw new AppError("Password is not valid", 401);

  // GENERATE ACCESS TOKEN
  const accessToken = jwt.sign(
    { userId: foundUser.id },
    process.env.JWT_ACCESS_TOKEN_SALT,
    { expiresIn: "1h" }
  );

  // GENERATE REFRESH TOKEN
  const refreshToken = jwt.sign(
    { userId: foundUser.id },
    process.env.JWT_REFRESH_TOKEN_SALT,
    { expiresIn: "1d" }
  );

  // SAVE REFRESH TOKEN INTO THE DB
  foundUser.refreshToken = refreshToken;
  await foundUser.save({ validateModifiedOnly: true });

  // MAKE SURE THE REFRESH TOKEN DOES NOT GET SENT IN THE JSON OBJECT
  foundUser.refreshToken = undefined;

  // SEND REFRESH TOKEN AS HTTPY ONLY COOKIE
  // res.cookie("jwt", refreshToken, {
  //   expires: new Date(
  //     Date.now() + process.env.JWT_REFRESH_TOKEN_EXPIRES_IN * 60 * 1000
  //   ),
  //   httpOnly: true,
  //   sameSite: "none",
  //   secure: true,
  // });
  res.setHeader(
    "Set-Cookie",
    `jwt=${refrehToken}; SameSite=None; Secure; HttpOnly; Expires=${new Date(
      Date.now() + process.env.JWT_REFRESH_TOKEN_EXPIRES_IN * 60 * 1000
    )}`
  );

  // SEND ACCESS TOKEN AS PART OF JSON WITH JWT KEY
  res.status(200).json({ success: true, data: foundUser, jwt: accessToken });
});

const logout = catchAsync(async function (req, res, next) {
  const user = req.user;

  user.refreshToken = undefined;
  await user.save({ validateModifiedOnly: true });

  res.clearCookie("jwt");

  res.status(200).json({ success: true, data: "Logout sucessfully" });
});

const authorizeUser = catchAsync(async function (req, res, next) {
  const { authorization } = req.headers;

  if (!authorization) throw new AppError("Authentication required", 401);

  const accessToken = authorization.split("Bearer ")[1];

  if (!/.*\..*\..*/.test(accessToken))
    throw new AppError("Token has been changed", 422);

  const verified = jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SALT);

  const { userId } = verified;
  const user = await User.findById(userId);

  if (!user) throw new AppError("User not found", 404);

  req.user = user;

  next();
});

const refreshTokenController = catchAsync(async function (req, res, next) {
  const refreshToken = req.cookies.jwt;

  if (!refreshToken) throw new AppError("Authentication required", 401);

  const foundUser = await User.findOne({ refreshToken });

  if (!foundUser) throw new AppError("User not found", 404);

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN_SALT);

  const { userId } = decoded;

  if (foundUser.id !== userId) throw new AppError("Not authorized", 403);

  const accessToken = jwt.sign(
    { userId: foundUser.id },
    process.env.JWT_ACCESS_TOKEN_SALT,
    { expiresIn: "1h" }
  );

  res.status(200).json({ success: true, jwt: accessToken });
});

module.exports = {
  register,
  login,
  logout,
  authorizeUser,
  refreshTokenController,
};
