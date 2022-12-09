const bodyParser = require("body-parser");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const path = require("path");

const passport = require("./config/passport");
const { ensureUser } = require("./middlewares/auth");
const homepageRoutes = require("./routes/homepage");
const oauthRoutes = require("./routes/oauth");
const apiRoutes = require("./routes/post");

dotenv.config({ path: "./config/.env" });

const INSTANCE = process.env.INSTANCE || "";
const MONGO_URI = process.env.MONGO_URI || "";
const PORT = process.env.PORT || 3000;
const SESSION_OPTIONS = {
  cookie: {
    /* cookie's lifetime: 4h */
    maxAge: 1000 * 60 * 60 * 4,
    secure: false,
  },
  resave: false,
  saveUninitialized: true,
  secret: process.env.SECRET || "",
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
};

const app = express();

/* set view engine */
app.set("view engine", "ejs");

/* set middlewares */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(session(SESSION_OPTIONS));

/* initialize passport */
app.use(passport.initialize());
app.use(passport.session());

/* set routes */
app.use("/api/v1/post", apiRoutes);
app.use("/homepage", homepageRoutes);
app.use("/oauth/google", oauthRoutes);

/* get root path */
app.get("/", ensureUser, (req, res) => {
  res.render("index", { title: "Socialify" });
});

/* get API docs */
app.use("/api-docs", express.static(path.join(__dirname, "/public/docs")));

app.post('/', function(req, res) {
	var item = req.body.formUrl; //TO DO: INPUT SANITIZATION
	console.log(item);
	var slug = item.split('track/').pop()
	console.log(slug);
});

/* set connection with mongo */
mongoose
  .connect(MONGO_URI)
  .then((result) => {
    console.log(`${INSTANCE} -> ${result.connection.host}`);
    app.listen(PORT, () => {
      console.log(`${INSTANCE} -> ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err.message);
  });
