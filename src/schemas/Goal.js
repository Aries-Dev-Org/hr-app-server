const mongoose = require('mongoose');
const { validGoalState } = require('./enums');
const Schema = mongoose.Schema;

const goalSchema = new Schema(
  {
    title: { type: String, required: true },
    detail: { type: String, required: true },
    group: { type: Boolean, default: false },
    state: { type: String, enum: validGoalState, default: 'wip' },
    note: { type: Number, default: 0 },
    devolution: { type: String },
    processed: { type: Boolean, default: false },
    toUserId: { type: Schema.ObjectId, ref: 'User', required: false },
    toUsersIds: [{ type: Schema.ObjectId, ref: 'User', required: false }],
    createUserId: { type: Schema.ObjectId, ref: 'User', required: true },
    evaluationId: { type: String },
    evaluationName: { type: String, default: '' },
    todos: [],
    feedbacks: [],
  },
  {
    timestamps: true,
  }
);

module.exports = goalSchema;
