const express = require("express").Router;

const {
  createPost,
  deleteAllPost,
  getAllPost,
  getUserPost,
  updatePostById,
  deletePostById,
} = require("../controllers/post");
const upload = require("../middlewares/multer");

const router = express();

router
  .route("/")
  .post(upload.single("photo"), createPost)
  .get(getAllPost)
  .delete(deleteAllPost);
router
  .route("/:id")
  .get(getUserPost)
  .patch(updatePostById)
  .delete(deletePostById);

module.exports = router;
