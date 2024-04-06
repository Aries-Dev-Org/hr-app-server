const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const noficationSchema = new Schema(
  {
    userId: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    subType: { type: String, required: true },
    url: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', noficationSchema);
