import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";
import fs from "fs";
import { v4 as uuid } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//@desc    Auth user/set token
//route   POST /api/users/auth
//@access  public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    const token = generateToken(res, user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      posts: user.posts,
      token: token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid credentials");
  }
});

//@desc Register user
//route POST /api/users
//@access public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error(`User ${name} already exists`);
  }
  const newUser = await User.create({ name, email, password });
  if (newUser) {
    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    });
  } else {
    res.status(400);
    throw new Error(`User ${name} not created`);
  }
});

//@desc Logout user
//route POST /api/users/logout
//@access public
const logOutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out " });
});

//@desc Get user profile
//route GET /api/users/profile
//@access private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
  };
  res.status(200).json(user);
});

// @desc update user profile
//route PUT /api/users/profile
// @access private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    // if (req.body.password) {
    //   user.password = req.body.password;
    // }
    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const getAllAuthors = asyncHandler(async (req, res) => {
  try {
    const authors = await User.find().select(
      "-password -createdAt -updatedAt -__v"
    );
    res.status(200).json(authors);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});
const changeAvatar = asyncHandler(async (req, res) => {
  try {
    if (!req.files?.avatar) {
      return res
        .status(400)
        .json({ error: "No avatar selected or something wrong.." });
    } else {
      const userId = req.user.id; // Assuming req.user.id is a valid user ID

      // Use User.findById to find the user by ID
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Handle avatar deletion if the user already has an avatar
      if (user.avatar) {
        const avatarPath = path.join(__dirname, "..", "uploads", user.avatar);

        // Delete the existing avatar file
        fs.unlink(avatarPath, (err) => {
          if (err) {
            console.error("Failed to delete existing avatar:", err);
          }
        });
      }

      // Process the new avatar file
      const { avatar } = req.files;
      if (!avatar) {
        return res.status(400).json({ error: "Avatar file not found" });
      }

      if (avatar.size > 500000) {
        return res
          .status(400)
          .json({ error: "Image size should be less than 500kb" });
      }

      const filename = avatar.name;
      const splitFilename = filename.split(".");
      const newFilename =
        splitFilename[0] +
        uuid() +
        "." +
        splitFilename[splitFilename.length - 1];

      // Move the new avatar file to the 'uploads' directory
      avatar.mv(
        path.join(__dirname, "..", "uploads", newFilename),
        async (err) => {
          if (err) {
            console.error("Failed to save new avatar:", err);
            return res.status(400).json({ error: "Failed to save new avatar" });
          }

          // Update the user's avatar field in the database
          user.avatar = newFilename;
          const updatedUser = await user.save();

          if (!updatedUser) {
            return res
              .status(500)
              .json({ error: "Failed to update user avatar" });
          }

          // Respond with only specific fields from the updated user document
          const responseData = {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            posts: updatedUser.posts,
          };
          res.status(200).json(responseData);
        }
      );
    }
  } catch (err) {
    console.error("An error occurred:", err);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});

export {
  authUser,
  registerUser,
  logOutUser,
  getUserProfile,
  updateUserProfile,
  getAllAuthors,
  changeAvatar,
};
