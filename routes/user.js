const router = require("express").Router();
const {
  register,
  login,
  logout,
  authorizeUser,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);

router.use(authorizeUser);

router.post("/logout", logout);

module.exports = router;
