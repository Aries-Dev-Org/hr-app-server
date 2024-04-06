/* eslint-disable no-mixed-operators */
const User = require('../models/User');
const MongoClient = require('mongodb').MongoClient;
// const Demand = require('../models/Demand');
const Benefit = require('../models/Benefit');
// const { sendNotification } = require('./notificationServices');
// const { DEMAND_DONE } = require('../constants/notificationTypes');

// module.exports.updateCoinsByDemand = async (req) => {
//   const client = new MongoClient(process.env.MONGO_DB);
//   await client.connect();
//   const session = client.startSession();
//   try {
//     await session.withTransaction(async () => {
//       const { coins } = req.body;
//       const demandId = req.params.reasonId;
//       User.find({ _id: req.user._id })
//         .cursor()
//         .eachAsync(async (doc) => {
//           const coinsMovement = {
//             date: new Date(),
//             operation: 'Solicitud Resuelta',
//             qty: coins,
//           };
//           doc.coins = doc.coins + coins;
//           doc.coinsMovements = [coinsMovement, ...doc.coinsMovements];
//           await doc.save();
//         });

//       const demand = await Demand.findByIdAndUpdate(
//         demandId,
//         { state: 'done' },
//         { new: true }
//       );

//       await sendNotification(demand.createUserId, DEMAND_DONE);
//     });
//     await session.commitTransaction();
//     session.endSession();
//     client.close();
//   } catch (e) {
//     await session.abortTransaction();
//     session.endSession();
//     client.close();
//     throw new Error('Modificacion interrumpida por falla en el servidor');
//   }
// };

module.exports.updateCoinsByBenefit = async (req) => {
  const client = new MongoClient(process.env.MONGO_DB);
  await client.connect();
  const session = client.startSession();
  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' },
  };

  try {
    await session.withTransaction(async () => {
      const { coins } = req.body;
      const benefitId = req.params.reasonId;
      const user = await User.findById(req.user._id);
      const coinsMovement = {
        date: new Date(),
        operation: 'Beneficio Solicitado',
        qty: -coins,
      };
      await User.findByIdAndUpdate(
        user._id,
        {
          coins: user.coins - coins,
          $push: { coinsMovements: coinsMovement },
        },
        { session }
      );

      await Benefit.findByIdAndUpdate(
        benefitId,
        {
          $addToSet: { applicants: req.user._id },
        },
        { session }
      );
      await session.commitTransaction();
    }, transactionOptions);
  } catch (e) {
    throw new Error('Modificacion interrumpida por falla en el servidor');
  } finally {
    await session.endSession();
  }
};
