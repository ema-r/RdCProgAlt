const express = require("express").Router;

const { renderPage } = require("../controllers/homepage");
const { ensureAuth } = require("../middlewares/auth");

const router = express();

router.route("/").get(ensureAuth, renderPage);

module.exports = router;
