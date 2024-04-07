const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const congratulationSchema = new Schema(
  {
    content: { type: String, required: true },
    createUserId: { type: Schema.ObjectId, ref: 'User' },
    toUserId: { type: Schema.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

module.exports = congratulationSchema;
