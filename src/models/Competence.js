/* eslint-disable max-len */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const competenceSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  scoreQuestionLabel: {
    type: String,
    default:
      'Tenés un máximo de 5 puntos y un mínimo de 1 punto para asignarte en esta competencia:',
  },
  scoreQuestionLabelOthers: {
    type: String,
    default:
      'Tenés un máximo de 5 puntos y un mínimo de 1 punto para asignarle a cada uno de los colaboradores en esta competencia:',
  },
  bonusQuestionLabel: {
    type: String,
    default:
      'Marcá al colaborador que consideres que cumpliría con la siguiente pregunta: Si tuvieses que elegir a una persona de tu equipo para que se quede después de hora, ¿a quién elegirías?',
  },
  behaviourQuestionLabel: {
    type: String,
    default: 'Elegí la opción que más te identifique:',
  },
  behaviourQuestionLabelOthers: {
    type: String,
    default: 'Elegí la opción que más lo identifique:',
  },
  behaviourQuestionOptions: [{ type: Object, default: [] }],
  roles: [{ type: String, default: [] }],
});

module.exports = mongoose.model('Competence', competenceSchema);
