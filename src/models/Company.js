const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const compaySchema = new Schema(
  {
    name: { type: String, required: false, default: '' },
    description: { type: String, required: false, default: '' },
    categories: [{ type: Schema.ObjectId, ref: 'Category' }],
    competences: { type: Number, default: 0 },
    assistance: { type: Number, default: 0 },
    objetives: { type: Number, default: 0 },
    impacts: {
      type: Object,
      default: {
        DOWN: 35,
        UP: 35,
        PAIR: 20,
        SELF: 10,
      },
    },
    logo: { type: String, required: false },
    isFirstEvaluation: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Company', compaySchema);
