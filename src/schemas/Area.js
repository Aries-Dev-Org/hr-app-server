const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const areaSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del area es obligatorio'],
    },
    management: { type: Boolean, default: false },
    bosses: [{ type: Schema.ObjectId, ref: 'User' }],
    employees: [{ type: Schema.ObjectId, ref: 'User' }],
    parentArea: { type: Schema.ObjectId, ref: 'Area', default: null },
    dependentAreas: [{ type: Schema.ObjectId, ref: 'Area', default: [] }],
    createUserId: { type: Schema.ObjectId, ref: 'User' },
    withoutBoss: { type: Boolean, default: false },
    withoutEmployees: { type: Boolean, default: false },
    hasOwnPonderations: { type: Boolean, default: false },
    evaluationCreated: { type: Boolean, default: false },
    ponderations: {
      competences: { type: Number, default: 0 },
      assistance: { type: Number, default: 0 },
      objetives: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = areaSchema;
