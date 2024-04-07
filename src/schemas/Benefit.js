const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const benefitSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true, default: '' },
    exchangeType: { type: String, required: true, default: 'points' },
    category: { type: Schema.ObjectId, ref: 'Category' },
    coins: { type: Number, required: false, default: 0 },
    field: { type: String, required: true, default: '' },
    internal: { type: Boolean, required: true, default: true },
    company: { type: Schema.ObjectId, ref: 'Company' },
    image: { type: String },
    applicants: [{ type: Schema.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = benefitSchema;
