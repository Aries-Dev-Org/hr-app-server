const ponderations = {
  SELF_BOSS_MANAGEMENT: 0.3, // Impactan en la autoevaluacion del gerente
  BOSS_BOSS_MANAGEMENT: 0.7, // Impactan en la evaluacion de un jefe hacia el gerente
  SELF_BOSS: 0.2, // Impactan en la autoevaluacion de un jefe
  EMPLOYEE_BOSS: 0.2, // Impactan en la evaluacion de un empleado hacia su jefe
  BOSS_MANAGEMENT_BOSS: 0.6, // Impactan en la evaluacion del jefe
  SELF_EMPLOYEE: 0.2, // Impactan en la autoevaluacion de un empleado
  TEAMMATES: 0.2, // Impactan en la evaluacion entre empleados
  BOSS_EMPLOYEE: 0.6, // Impactan en la evaluacion de un jefe hacia un empleado
  SELF_ALONE_EMPLOYEE: 0.25, // Impactan en la evaluacion hacia un empleado sin compañeros
  BOSS_ALONE_EMPLOYEE: 0.75, // Impactan en la evaluacion hacia un empleado sin compañeros

  EMPLOYEE_MANAGER: 0.2, // H
};
// const ponderationsObj = {
//   manager: {
//     withEmployees: {
//       employee: 0.5,
//       boss: 0.35,
//       self: 0.3,
//     },
//     withoutEmployees: {
//       boss: 0.7,
//       self: 0.3,
//     },
//   },
//   boss: {
//     withManagers: {
//       manager: 0.3,
//       boss: 0.3,
//       employee: 0.2,
//       self: 0.2,
//     },
//     withoutManagers: {
//       boss: 0.6,
//       employee: 0.2,
//       self: 0.2,
//     },
//   },
//   employee: {
//     withManagers: {
//       manager: 0.3,
//       boss: 0.3,
//       employee: 0.2,
//       self: 0.2,
//     },
//     withoutManagers: {
//       boss: 0.6,
//       employee: 0.2,
//       self: 0.2,
//     },
//   },
// };

const ponderationsObj = {
  manager: {
    withEmployees: {
      withBosses: {
        withManagers: {
          manager: '',
          boss: '',
          employee: '',
          self: '',
        },
        withoutManagers: {
          boss: 0.5,
          employee: 0.3,
          self: 0.2,
        },
      },
      withoutBosses: {
        withManagers: {
          manager: '',
          employee: '',
          self: '',
        },
        withoutManagers: {
          employee: '',
          self: '',
        },
      },
    },
    withoutEmployees: {
      withBosses: {
        withManagers: {
          manager: '',
          boss: '',
          self: '',
        },
        withoutManagers: {
          boss: '',
          self: '',
        },
      },
      withoutBosses: {
        withManagers: {
          manager: '',
          self: '',
        },
        withoutManagers: {
          self: '',
        },
      },
    },
  },
  boss: {
    withEmployees: {
      withBosses: {
        withManagers: {
          manager: '',
          boss: '',
          employee: '',
          self: '',
        },
        withoutManagers: {
          boss: '',
          employee: '',
          self: '',
        },
      },
      withoutBosses: {
        withManagers: {
          manager: '',
          employee: '',
          self: '',
        },
        withoutManagers: {
          employee: '',
          self: '',
        },
      },
    },
    withoutEmployees: {
      withBosses: {
        withManagers: {
          manager: '',
          boss: '',
          self: '',
        },
        withoutManagers: {
          boss: '',
          self: '',
        },
      },
      withoutBosses: {
        withManagers: {
          manager: '',
          self: '',
        },
        withoutManagers: {
          self: '',
        },
      },
    },
  },
  employee: {
    withEmployees: {
      withBosses: {
        withManagers: {
          manager: '',
          boss: '',
          employee: '',
          self: '',
        },
        withoutManagers: {
          boss: '',
          employee: '',
          self: '',
        },
      },
      withoutBosses: {
        withManagers: {
          manager: '',
          employee: '',
          self: '',
        },
        withoutManagers: {
          employee: '',
          self: '',
        },
      },
    },
    withoutEmployees: {
      withBosses: {
        withManagers: {
          manager: '',
          boss: '',
          self: '',
        },
        withoutManagers: {
          boss: '',
          self: '',
        },
      },
      withoutBosses: {
        withManagers: {
          manager: '',
          self: '',
        },
        withoutManagers: {
          self: '',
        },
      },
    },
  },
};

module.exports = { ponderations, ponderationsObj };
