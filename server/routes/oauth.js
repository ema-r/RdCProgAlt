const express = require("express").Router;

const { callback, login, logout } = require("../controllers/oauth");

const router = express();

router.route("/").get(login);
router.route("/callback").get(callback);
router.route("/logout").get(logout);

module.exports = router;
