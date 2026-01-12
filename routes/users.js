var express = require("express");
var router = express.Router();
var User = require("../models/user");

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

/* GET register page */
router.get("/register", function (req, res, next) {
  res.render("users/register", { title: "Register", error: null });
});

/* POST register */
router.post("/register", async function (req, res, next) {
  try {
    const { email, password, confirmPassword, ime } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.render("users/register", {
        title: "Register",
        error: "Passwords do not match!",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.render("users/register", {
        title: "Register",
        error: "User with this email already exists!",
      });
    }

    // Create new user
    const newUser = new User({
      email: email,
      password: password,
      ime: ime,
    });

    await newUser.save();

    res.redirect("/users/login?registered=true");
  } catch (err) {
    next(err);
  }
});

/* GET login page */
router.get("/login", function (req, res, next) {
  const registered = req.query.registered === "true";
  res.render("users/login", {
    title: "Login",
    error: null,
    success: registered ? "Successfully registered! You can now login." : null,
  });
});

/* POST login */
router.post("/login", async function (req, res, next) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.render("users/login", {
        title: "Login",
        error: "Invalid email or password!",
        success: null,
      });
    }

    // Check password
    if (user.password !== password) {
      return res.render("users/login", {
        title: "Login",
        error: "Invalid email or password!",
        success: null,
      });
    }

    // Save user to session
    req.session.userId = user._id;
    req.session.userEmail = user.email;
    req.session.userName = user.ime || user.email;

    res.redirect("/");
  } catch (err) {
    next(err);
  }
});

/* GET logout */
router.get("/logout", function (req, res, next) {
  req.session.destroy(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;
