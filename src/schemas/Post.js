const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    channel: { type: Schema.ObjectId, ref: 'Channel' },
    title: { type: String, required: true },
    content: { type: String, required: true },
    likes: [
      {
        userId: { type: Schema.ObjectId },
        fullname: { type: String },
        avatar: { type: String },
      },
    ],
    comments: [
      {
        userId: { type: Schema.ObjectId },
        content: { type: String },
        fullname: { type: String },
        avatar: { type: String },
        date: { type: String },
      },
    ],
    reactions: [
      {
        userId: { type: Schema.ObjectId, ref: 'User' },
        fullname: { type: String },
        emoji: { type: String },
        unified: { type: String },
      },
    ],
    createUserId: { type: Schema.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

module.exports = postSchema;
