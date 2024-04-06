const mongoose = require('mongoose');
const { validRoles } = require('./enums');
const Schema = mongoose.Schema;

const userEvaluationSchema = new Schema(
  {
    label: { type: String, required: true },
    isSelfEvaluation: { type: Boolean, default: false },
    withBonusPoint: { type: Boolean, default: false },
    answers: { type: Object, default: null },
    done: { type: Boolean, default: false },
    dateCompleted: { type: String, default: '' },
    processed: { type: Boolean, default: false },
    competences: [{ type: Schema.ObjectId, ref: 'Competence' }],
    affectedUsers: [
      {
        forRole: { type: String, required: true, enum: validRoles },
        evaluationType: { type: String, required: true },
        user: { type: Schema.ObjectId, required: true, ref: 'User' },
        isAddedUser: { type: Boolean, required: true },
        reason: { type: String, required: false, default: '' },
        postEvaluation: { type: Boolean, default: false },
      },
    ],
    evaluation: { type: Schema.ObjectId, ref: 'Evaluation' },
    user: { type: Schema.ObjectId, ref: 'User' },
    createUserId: { type: Schema.ObjectId, ref: 'User' },
    areaName: { type: String, default: '' },
    isMultiple: { type: Boolean, default: false },
    type: { type: String, default: '' },
    reOpen: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('UserEvaluation', userEvaluationSchema);
