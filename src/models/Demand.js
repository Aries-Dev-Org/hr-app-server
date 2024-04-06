const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { validDemandState, validDemandPriorities } = require('./enums');

const demandSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    comments: [
      {
        userId: { type: Schema.ObjectId },
        content: { type: String },
        fullname: { type: String },
        date: { type: String },
        read: { type: Boolean, default: false },
      },
    ],
    modifications: {
      type: {
        userId: { type: Schema.ObjectId },
        seeing: { type: Boolean },
      },
      default: null,
    },
    createUserId: { type: Schema.ObjectId, ref: 'User' },
    toUserId: { type: Schema.ObjectId, ref: 'User' },
    state: { type: String, enum: validDemandState, default: 'pending' },
    priority: { type: Number, enum: validDemandPriorities, default: 1 },
    expiredDate: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Demand', demandSchema);
