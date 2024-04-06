const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const evaluationSchema = new Schema(
  {
    name: { type: String, required: true },
    dateTo: { type: String },
    done: { type: Boolean, default: false },
    createUserId: { type: Schema.ObjectId, ref: 'User' },
    isCreationEnabled: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Evaluation', evaluationSchema);
