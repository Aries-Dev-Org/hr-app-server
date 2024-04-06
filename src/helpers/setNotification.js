const {
  NEW_RECOGNITION,
  NEW_EVALUATION,
  APPLY_TO_POSTULATION,
  NEW_DEMAND,
  NEW_GOAL,
  UPDATE_GOAL,
  DEMAND_DONE,
  DEMAND_MODIFIED,
  ADD_USER_TO_EVALUATION,
} = require('../constants/notificationSubTypes');

const setNotification = (userId, type, subType) => {
  let message = '';
  let url = '';

  switch (subType) {
    case NEW_RECOGNITION:
      message = 'Tenés un nuevo reconocimiento';
      url = '/reconocimientos';
      break;
    case NEW_EVALUATION:
      message = 'Hay una nueva evaluación disponible';
      url = '/evaluaciones';
      break;
    case ADD_USER_TO_EVALUATION:
      message = 'Se agregaron nuevas evaluaciones';
      url = '/evaluaciones';
      break;
    case APPLY_TO_POSTULATION:
      message = 'Te postulaste a una búsqueda';
      url = '/empresa/busquedas';
      break;
    case NEW_DEMAND:
      message = 'Tenés una nueva solicitud';
      url = '/solicitudes';
      break;
    case DEMAND_MODIFIED:
      message = 'Una solicitud fué modificada / comentada';
      url = '/solicitudes';
      break;
    case DEMAND_DONE:
      message = 'Solicitud completada';
      url = '/solicitudes';
      break;
    case NEW_GOAL:
      message = 'Tenés un nuevo objetivo asignado';
      url = '/objetivos/actuales';
      break;
    case UPDATE_GOAL:
      message = 'Se actualizó un objetivo';
      url = '/objetivos/actuales';
      break;
    default:
  }
  return { userId, message, type, subType, url, read: false };
};

module.exports = setNotification;
