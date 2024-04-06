const mongoose = require('mongoose');
const { validRecognitionReactions } = require('./enums');
const Schema = mongoose.Schema;

const recognitionSchema = new Schema(
  {
    reason: { type: String, required: true },
    createUserId: { type: Schema.ObjectId, ref: 'User' },
    recognizedUserId: { type: Schema.ObjectId, ref: 'User' },
    reactions: [
      {
        userId: { type: Schema.ObjectId, ref: 'User' },
        type: { type: String, enum: validRecognitionReactions },
        fullname: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Recognition', recognitionSchema);
