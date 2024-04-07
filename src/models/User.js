const mongoose = require('mongoose');
const { validRoles, validCategories } = require('./enums');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    lastname: { type: String, required: true, trim: true },
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    mustChangePassword: { type: Boolean, default: false },
    birthDate: { type: String, default: '' },
    isSuperAdmin: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    dni: { type: Number },
    entry: { type: String, default: '' },
    area: { type: Schema.ObjectId, ref: 'Area', default: null },
    score: {
      competences: { type: Number, default: 0 },
      competencesScores: [
        {
          competenceId: { type: String, required: true },
          competencePoints: { type: Number, default: 0 },
        },
      ],
      objetives: { type: Number, default: 0 },
      assistance: { type: Number, default: 0 },
      totalScore: { type: Number, default: 0 },
      comments: [{ type: String }],
      evaluationId: { type: String },
      evaluationName: { type: String },
      date: { type: String, default: '' },
    },
    previousScores: [
      {
        date: { type: String, default: '' },
        competences: { type: Number, default: 0 },
        competencesScores: [],
        objetives: { type: Number, default: 0 },
        assistance: { type: Number, default: 0 },
        totalScore: { type: Number, default: 0 },
        comments: [{ type: String }],
        evaluationId: { type: String },
        evaluationName: { type: String },
      },
    ],
    coins: { type: Number, default: 0 },
    avatar: { type: String },
    surveysResponses: [{ type: Number, _id: false }],
    showSurvey: { type: Boolean, default: false },
    recognitions: [
      {
        _id: false,
        reason: { type: String },
        createUserId: { type: Schema.ObjectId, ref: 'User' },
      },
    ],
    recognitionsMade: { type: Number, default: 0 },
    role: { type: String, default: 'employee', enum: validRoles },
    roleLabel: { type: String, default: '' },
    range: { type: Number, default: 1 },
    category: { type: String, default: 'Bronze', enum: validCategories },
    personalData: {
      birthDate: { type: String, default: '' },
      civilStatus: { type: String, default: '' },
      children: { type: Boolean, default: false },
      childrenQuantity: { type: Number, default: 0 },
      childrenComing: { type: Number, default: 0 },
      studies: { type: Boolean, default: false },
      studiesList: [],
      hobbies: { type: String, default: '' },
    },
    developmentHistory: [{ type: String, default: [] }],
    profiles: [{ type: Schema.ObjectId, ref: 'UserProfile', default: [] }],
    isNotEvaluable: { type: Boolean, default: false },
    personalDataCompleted: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    inactiveMotive: { type: String },
    coinsMovements: [],
    actionPlan: {
      text: { type: String, default: '' },
      viewed: { type: Boolean, default: false },
      createUserId: { type: Schema.ObjectId, ref: 'User' },
    },
    previousActionPlans: [
      {
        text: { type: String, default: '' },
        viewed: { type: Boolean, default: false },
        createUserId: { type: Schema.ObjectId, ref: 'User' },
        evaluationId: { type: String },
      },
    ],
    evaluationRelationships: {
      confirmed: { type: Boolean, default: false },
      affectedUsers: [
        {
          forRole: { type: String, required: true, enum: validRoles },
          userArea: { type: Schema.ObjectId, ref: 'Area' },
          evaluationType: { type: String, required: true },
          user: { type: Schema.ObjectId, required: true, ref: 'User' },
          isAddedUser: { type: Boolean, required: true },
          reason: { type: String, required: false, default: '' },
          selected: { type: Boolean, required: true, default: false },
          postEvaluation: { type: Boolean, default: false },
        },
      ],
    },
    evaluationProcessed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
