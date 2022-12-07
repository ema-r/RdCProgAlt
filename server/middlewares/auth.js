module.exports = {
  ensureAuth: (req, res, next) => {
    req.isAuthenticated() ? next() : res.redirect("/");
  },
  ensureUser: (req, res, next) => {
    !req.isAuthenticated() ? next() : res.redirect("/homepage");
  },
};
