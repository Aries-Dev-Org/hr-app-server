/* eslint-disable max-len */
module.exports.getNineboxText = (competences, objetives, fullname) => {
  const ninboxTexts = [
    `Es una persona que genera gran impulso a su alrededor y muestra grandes cualidades para desempeñarse dentro de la organización. Es altamante recomendado y genera un valor agregado a la compañia. Se espera que pueda seguir manteniendo su rendimiento en estos niveles, tanto en el cumplimiento de sus objetivos como en la valoración de las competencias deseadas. ${fullname} ha logrado posicionarse dentro de los recursos humanos más valorados de la compañía.`,
    `Es una persona cuyo foco esta puesto en el cumplimiento de objetivos y los realiza con excelencia. Su principal desafío consiste en comprender las competencias asociadas a su puesto y llevarlas al maximo nivel. ${fullname} ha logrado ser valorado de manera muy satisfactoria dentro de la organización.`,
    'Es una persona cuyo foco esta puesto en el cumplimiento de objetivos y los realiza con excelencia. Sin embargo, las competencias requeridas en su rol no alcanzan los niveles esperados por la organización. Deberá trabajar en las mismas sin desalentar el cumplimiento de sus objetivos.',
    'Es una persona que comprende a la perfección las competencias requeridas para su puesto. Su principal desafío va a consistir en perseguir los objetivos planteados por su jefe con mayor impetú para lograr el cumplimiento de los mismos con excelencia.',
    'Es un persona que persigue sus objetivos y esta bien valorada de acuerdo a las competencias requeridas. Su principal desafío será ajustar su rendimiento para lograr alcanzar un mayor nivel en los resultados obtenidos.',
    'Es una persona que no ha logrado comprender las competencias requeridas en su puesto, sin embargo logra comprometerse con los objetivos planteados. Deberá trabajar para desarrollar dichas competencias y a su vez, tener mayor dedicación para alcanzar los resultados esperados.',
    'Es una persona que comprende a la perfección las competencias requeridas para su puesto. Sin embargo, no logra comprometerse con los objetivos planteados por su jefe. Su principal desafio va a consistir en adquirir herramientas para lograr los resultados deseados ya que cuenta con el potencial necesario para su crecimiento',
    'Es una persona que tiene noción de las competencias requeridas en su puesto, sin embargo, no logra la valoración adecuada de las mismas. A su vez, deberá trabajar principalmente en el cumplimiento de sus objetivos ya que no esta obteniendo los resultados deseados en su sector.',
    'Es una persona que esta teniendo dificultades tanto para la comprensión de las competencias requeridas en su puesto como para el cumpliento de los objetivos planteados. Deberá trabajar en su compromiso con la organización ya que no esta cumpliendo con las expectativas.',
  ];

  if (competences >= 80 && objetives >= 80) {
    return ninboxTexts[0];
  } else if (competences >= 40 && competences < 80 && objetives >= 80) {
    return ninboxTexts[1];
  } else if (competences < 40 && objetives >= 80) {
    return ninboxTexts[2];
  } else if (competences >= 80 && objetives >= 40 && objetives < 80) {
    return ninboxTexts[3];
  } else if (
    competences >= 40 &&
    competences < 80 &&
    objetives >= 40 &&
    objetives < 80
  ) {
    return ninboxTexts[4];
  } else if (competences < 40 && objetives >= 40 && objetives < 80) {
    return ninboxTexts[5];
  } else if (competences >= 80 && objetives < 40) {
    return ninboxTexts[6];
  } else if (competences >= 40 && competences < 80 && objetives < 40) {
    return ninboxTexts[7];
  } else if (competences < 40 && objetives < 40) {
    return ninboxTexts[8];
  }
};
