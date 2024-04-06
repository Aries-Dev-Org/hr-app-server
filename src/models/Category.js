const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
    exchangeType: { type: String, required: true, default: 'points' },
    minPoints: { type: Number, required: false, default: null },
    maxPoints: { type: Number, required: false, default: null },
    color: { type: String, required: false, default: '' },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model('Category', categorySchema);
