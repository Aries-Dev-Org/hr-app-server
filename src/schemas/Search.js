const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const searchSchema = new Schema(
  {
    area: { type: Schema.ObjectId, required: true, ref: 'Area' },
    job: { type: String, required: true },
    tasks: { type: String, required: true },
    requirements: { type: String, default: false },
    postulatedUsers: [{ type: Schema.ObjectId, ref: 'User' }],
    createUserId: { type: Schema.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

module.exports = searchSchema;
