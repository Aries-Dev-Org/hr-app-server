const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const noveltySchema = new Schema(
  {
    content: { type: String, required: true },
    createUserId: { type: Schema.ObjectId, ref: 'User' },
    redirect: { type: Boolean, default: false },
    redirectLabel: { type: String },
    redirectUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = noveltySchema;
