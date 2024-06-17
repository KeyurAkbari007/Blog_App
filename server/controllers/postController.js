import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { fileURLToPath } from "url";
import { promisify } from "util";

import path, { dirname } from "path";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import fs from "fs";
import { v4 as uuid } from "uuid";

//@desc    create a new post
//route   POST /api/posts/
//@access  protected
const createPost = async (req, res) => {
  try {
    const { title, category, description } = req.body;
    if (!title || !category || !description || !req.files) {
      return res.status(400).json({
        error: "Please provide all fields",
      });
    }
    const { thumbnail } = req.files;

    if (thumbnail.size > 2000000) {
      return res.status(400).json({
        error: "Image size should be less than 2MB",
      });
    }
    const filename = thumbnail.name;
    const splitFilename = filename.split(".");
    const newFilename =
      splitFilename[0] + uuid() + "." + splitFilename[splitFilename.length - 1];
    thumbnail.mv(
      path.join(__dirname, "..", "uploads", newFilename),
      async (err) => {
        if (err) {
          return res.status(400).json({
            error: "Failed to save new thumbnail",
          });
        }
        const newPost = new Post({
          title,
          category,
          description,
          thumbnail: newFilename,
          creator: req.user.id,
        });
        const post = await newPost.save();
        if (!post) {
          return res.status(400).json({
            error: "Failed to save new post",
          });
        }

        const user = await User.findById(req.user.id);
        const userPostCount = user.posts + 1;
        await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });

        res.status(200).json(post);
      }
    );
  } catch (err) {
    res.status(401).json({
      error: err.message,
    });
  }

  // res.status(200).json({ message: "post created" });
};

//@desc  get all  posts
//route   GET /api/posts/getAllposts
//@access  public
const getAllposts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ updateAt: -1 }).populate({
      path: "creator",
      select: "_id avatar name",
    });
    res.status(200).json(posts);
  } catch (err) {
    res.status(401).json({
      error: err.message,
    });
  }
};

//@desc  get by id
//route   GET /api/posts/:id
//@access  public
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate({
      path: "creator",
      select: "_id avatar name",
    });
    console.log(post);
    if (!post) {
      return res.status(404).json({ error: "posts not found" });
    }
    res.status(200).json(post);
  } catch (err) {
    res.status(401).json({
      error: err.message,
    });
  }
};

//@desc  get by category
//route   GET /api/posts/categories/:category
//@access  public
const getPostByCategory = async (req, res) => {
  try {
    const posts = await Post.find({ category: req.params.category }).populate({
      path: "creator",
      select: "_id avatar name",
    });
    res.status(200).json(posts);
  } catch (err) {
    res.status(401).json({
      error: err.message,
    });
  }
};

//@desc  get by author
//route   GET /api/posts/userPosts
//@access  Protected
const getPostByUser = async (req, res) => {
  try {
    const posts = await Post.find({ creator: req.user._id })
      .sort({
        createdAt: -1,
      })
      .populate({
        path: "creator",
        select: "_id avatar name",
      });
    res.status(200).json(posts);
  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
};

//@desc  get by author
//route   GET /api/posts/users/:id
//@access  public
const getPostsByUserID = async (req, res) => {
  try {
    const posts = await Post.find({ creator: req.params.id })
      .sort({
        createdAt: -1,
      })
      .populate({
        path: "creator",
        select: "_id avatar name",
      });
    res.status(200).json(posts);
  } catch (err) {
    res.status(400).json({
      error: err.message,
    });
  }
};

//@desc  Edit Post
//route   PATCH /api/posts/:id
//@access  public
const editPost = async (req, res) => {
  try {
    let filename;
    let newFilename;
    let updatepost;
    const postId = req.params.id;
    let { title, description, category } = req.body;

    if (!title && !description && !category) {
      return res.status(422).json({
        error: "Please provide all valid fields",
      });
    }
    if (description && description.length < 12) {
      return res.status(422).json({
        error: "Description should be at least 12 characters",
      });
    }

    if (!req.files) {
      updatepost = await Post.findByIdAndUpdate(
        postId,
        {
          title,
          description,
          category,
        },
        { new: true }
      );
      return res.status(200).json(updatepost);
    } else {
      const getOldPost = await Post.findById(postId);

      // Use path.join to build the correct path
      const oldFilePath = path.join(
        __dirname,
        "..",
        "uploads",
        getOldPost.thumbnail
      );

      // Use the 'promisify' utility to turn 'unlink' into a promise
      const unlinkAsync = promisify(fs.unlink);

      // Ensure 'unlink' operation completes before proceeding
      await unlinkAsync(oldFilePath);

      const { thumbnail } = req.files;
      if (thumbnail.size > 2000000) {
        return res.status(400).json({
          error: "Image size should be less than 2MB",
        });
      }

      filename = thumbnail.name;
      const splitFilename = filename.split(".");
      newFilename =
        splitFilename[0] +
        uuid() +
        "." +
        splitFilename[splitFilename.length - 1];

      thumbnail.mv(
        path.join(__dirname, "..", "uploads", newFilename),
        async (err) => {
          if (err) {
            return res.status(400).json({
              error: "Failed to save new thumbnail",
            });
          }

          // Update post with the new thumbnail filename
          updatepost = await Post.findByIdAndUpdate(
            postId,
            {
              title,
              description,
              category,
              thumbnail: newFilename,
            },
            { new: true }
          );

          return res.status(200).json(updatepost);
        }
      );
    }
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};

//@desc  Delete Post
//route   DELETE /api/posts/:id
//@access  public
const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    if (!postId) {
      return res.status(422).json({
        error: "Please provide a valid id",
      });
    }
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        error: "Post not found",
      });
    }
    const filename = post.thumbnail;
    const oldFilePath = path.join(__dirname, "..", "uploads", filename);
    if (req.user.id == post.creator) {
      const unlinkAsync = promisify(fs.unlink);
      await unlinkAsync(oldFilePath);
      await Post.findByIdAndDelete(postId);

      const user = await User.findById(req.user.id);
      const userPostCount = user.posts - 1;
      await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });
      res.status(200).json({ message: "Post deleted" });
    } else {
      return res.status(401).json({
        error: "You are not authorized to delete this post",
      });
    }
  } catch (err) {
    res.status(401).json({
      error: err.message,
    });
  }
};

export {
  createPost,
  deletePost,
  editPost,
  getPostByCategory,
  getPostByUser,
  getPost,
  getAllposts,
  getPostsByUserID,
};
