/* eslint-disable no-console */
const cron = require('node-cron');
const moment = require('moment');
const User = require('../models/User');
const Reminder = require('../models/Reminder');
const { createNovelty } = require('./noveltyServices');
const processName = process.env.name || 'primary';
// asteriscos son: minutos (0-59), horas(0-23), dia del mes (0-31), mes (Jan-Dec), dia de la semana (Mon-Sun)

//Setea en true para que se muestre el formulario
cron.schedule('0 5 * * Thu', async () => {
  await User.updateMany(
    { role: 'employee', isActive: true, isNotEvaluable: false },
    { showSurvey: true }
  );
});

// //Setea en false para que se oculte el formulario
cron.schedule('0 5 * * Fri', async () => {
  await User.updateMany(
    { role: 'employee', isActive: true, isNotEvaluable: false },
    { showSurvey: false }
  );
});

// Calcula los cumpleaños, todos los dias a las 5:00hs
cron.schedule('0 5 * * *', async () => {
  if (processName.search(/primary/) !== -1) {
    const birthdayUser = await User.find({
      'personalData.birthDate': {
        $regex: moment(Date.now()).format('MM-DD'),
        $options: 'i',
      },
      active: true,
      isNotEvaluable: false,
    }).select('fullname');

    if (birthdayUser.length) {
      const birthDateUsers = birthdayUser
        .map((u) => u.fullname)
        .join(', ')
        .replace(/, ([^,]*)$/, ' y $1');

      const novelty = {
        content: `Hoy es el cumpleaños de ${birthDateUsers}.`,
      };

      await createNovelty(null, novelty);
    }
  }
});

// Remueve los reconocimientos realizados, el 1 del mes, a las 01:00
cron.schedule('0 1 1 * *', async () => {
  await User.updateMany({}, { recognitionsMade: 0 });
});

// Remueve los recordatorio que ya pasaron todos los dias a las 01:00
cron.schedule('0 1 * * *', async () => {
  const today = moment(Date.now());
  const reminders = await Reminder.find({});

  for await (const reminder of reminders) {
    if (moment(reminder.date).diff(today, 'days') < 0) {
      await Reminder.findByIdAndRemove(reminder._id);
      console.log(
        `El recordatorio "${reminder.content}" ha pasado y ha sido eliminado`
      );
    }
  }
});
