import { Schema, model } from "mongoose";

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Technology",
        "Entertainment",
        "Politics",
        "Science",
        "Sports",
        "Travel",
        "Music",
        "News",
        "Entertainment",
        "Science",
        "Sports",
        "Travel",
        "Education",
        "Weather",
        "Art",
        "Business",
      ],
    },
    thumbnail: {
      type: String,
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true } // Add timestamps option
);

const Post = model("Post", postSchema);

export default Post;
