const fetch = require("node-fetch");

module.exports = {
  renderPage: async (req, res) => {
    await fetch("http://nginx/api/v1/post")
      .then((result) => result.json())
      .then((result) => {
        res.render("homepage", {
          title: "Homepage",
          user: req.session.passport.user,
          post: result,
        });
      });
  },
};
