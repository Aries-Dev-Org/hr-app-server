const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const channelSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    subscribers: [{ type: Schema.ObjectId, ref: 'User' }],
    generalInterest: { type: Boolean, default: false },
    createUserId: { type: Schema.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

module.exports = channelSchema;
