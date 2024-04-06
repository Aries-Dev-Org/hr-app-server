const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reminderSchema = new Schema(
  {
    content: { type: String, required: true },
    date: { type: Date, default: '' },
    createUserId: { type: Schema.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Reminder', reminderSchema);
