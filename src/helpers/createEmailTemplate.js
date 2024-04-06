/* eslint-disable indent */
const {
  RESET_PASSWORD,
  TEST_EMAIL,
} = require('../constants/notificationTypes');
const {
  NEW_EVALUATION,
  NEW_GOAL,
} = require('../constants/notificationSubTypes');

const baseURL = process.env.CLIENT_BASE_URL;

const header = (name) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Juardi Admin - Test Email</title>
    <style>
      /* cyrillic-ext */
      @font-face {
        font-family: 'Raleway';
        font-style: normal;
        font-weight: 200;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyCAIT4ttDfCmxA.woff2)
          format('woff2');
        unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF,
          U+A640-A69F, U+FE2E-FE2F;
      } /* cyrillic */
      @font-face {
        font-family: 'Raleway';
        font-style: normal;
        font-weight: 200;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyCkIT4ttDfCmxA.woff2)
          format('woff2');
        unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
      } /* vietnamese */
      @font-face {
        font-family: 'Raleway';
        font-style: normal;
        font-weight: 200;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyCIIT4ttDfCmxA.woff2)
          format('woff2');
        unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169,
          U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB;
      } /* latin-ext
        */
      @font-face {
        font-family: 'Raleway';
        font-style: normal;
        font-weight: 200;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyCMIT4ttDfCmxA.woff2)
          format('woff2');
        unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB,
          U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
      } /* latin */
      @font-face {
        font-family: 'Raleway';
        font-style: normal;
        font-weight: 200;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyC0IT4ttDfA.woff2)
          format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
          U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193,
          U+2212, U+2215, U+FEFF, U+FFFD;
      } /* cyrillic-ext */
      @font-face {
        font-family: 'Raleway';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyCAIT4ttDfCmxA.woff2)
          format('woff2');
        unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF,
          U+A640-A69F, U+FE2E-FE2F;
      } /* cyrillic */
      @font-face {
        font-family: 'Raleway';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyCkIT4ttDfCmxA.woff2)
          format('woff2');
        unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
      } /* vietnamese */
      @font-face {
        font-family: 'Raleway';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyCIIT4ttDfCmxA.woff2)
          format('woff2');
        unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169,
          U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB;
      } /* latin-ext
        */
      @font-face {
        font-family: 'Raleway';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyCMIT4ttDfCmxA.woff2)
          format('woff2');
        unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB,
          U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
      } /* latin */
      @font-face {
        font-family: 'Raleway';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyC0IT4ttDfA.woff2)
          format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
          U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193,
          U+2212, U+2215, U+FEFF, U+FFFD;
      } /* cyrillic-ext */
      @font-face {
        font-family: 'Raleway';
        font-style: normal;
        font-weight: 600;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyCAIT4ttDfCmxA.woff2)
          format('woff2');
        unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF,
          U+A640-A69F, U+FE2E-FE2F;
      } /* cyrillic */
      @font-face {
        font-family: 'Raleway';
        font-style: normal;
        font-weight: 600;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyCkIT4ttDfCmxA.woff2)
          format('woff2');
        unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
      } /* vietnamese */
      @font-face {
        font-family: 'Raleway';
        font-style: normal;
        font-weight: 600;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyCIIT4ttDfCmxA.woff2)
          format('woff2');
        unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169,
          U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB;
      } /* latin-ext
        */
      @font-face {
        font-family: 'Raleway';
        font-style: normal;
        font-weight: 600;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyCMIT4ttDfCmxA.woff2)
          format('woff2');
        unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB,
          U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
      } /* latin */
      @font-face {
        font-family: 'Raleway';
        font-style: normal;
        font-weight: 600;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/raleway/v28/1Ptug8zYS_SKggPNyC0IT4ttDfA.woff2)
          format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
          U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193,
          U+2212, U+2215, U+FEFF, U+FFFD;
      }
      * {
        box-sizing: border-box;
        font-family: 'Raleway', sans-serif;
        font-size: 18px;
        line-height: 24px;
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0">
    <table style="width: 100%; background-color: #e3e3e3; padding: 40px 0 20px">
      <tr>
        <td>
          <table
            style="
              border-collapse: collapse;
              background-color: white;
              width: 500px;
              margin: 0 auto;
            "
          >
            <tr>
              <td>
                <img
                  src="https://juardi.nyc3.digitaloceanspaces.com/assets/email-header.png"
                  alt="logo"
                  width="500px"
                />
              </td>
            </tr>
            <tr>
              <td
                style="
                  padding: 30px 20px 0;
                  padding-bottom: 10px;
                  font-size: 24px;
                  line-height: 30px;
                  color: #4f4f4f;
                "
              >
              <p>Hola ${name}.</p>`;

const footer = (link) => `</td>
            </tr>
            <tr>
              <td
                style="
                  text-align: center;
                  padding: 0 0 50px;
                  border-bottom: 1px solid #36b29a;
                "
              >
                <a
                  style="
                    padding: 12px 24px;
                    background-color: #36b29a;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                    border: none;
                    text-decoration: none;
                  "
                  href="${baseURL}/#/${link}"
                >
                  IR A JUARDI
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td>
          <p
            style="
              width: 450px;
              margin: 20px auto;
              color: gray;
              font-size: 16px;
              text-align: center;
            "
          >
            No respondas este e-mail, fué generado automáticamente por nuestra
            plataforma.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const createEmailTemplate = (type = TEST_EMAIL, data) => {
  switch (type) {
    case TEST_EMAIL:
      return {
        subject: 'Email de test',
        text: 'Email de test',
        html: `${header(data.name)}
          <p>
            El email es para testear el envío de emails desde la plataforma Juardi. Puedés
            visitarla haciendo click en el siguiente link.
          </p>
          ${footer(data.link)}`,
      };

    case RESET_PASSWORD:
      return {
        subject: 'Link para cambiar tu contraseña.',
        text: 'Link para cambiar tu contraseña',
        html: `${header(data.name)}
          <p>Estás recibiendo este correo porque informaste que olvidaste tu contraseña.</p>
          <p>Si no es así, informá al personal correspondiente para advertir que alguien está 
            intentando ingresar a la plataforma en tu nombre.</p>
          <p>Para cambiar tu contraseña seguí el siguiente link:</p>
          ${footer(data.link)}`,
      };

    case NEW_EVALUATION:
      return {
        subject: 'Nuevo proceso de Evaluación.',
        text: 'Nuevo proceso de Evaluación',
        html: `${header(data.name)}
          <p>
            Se ha iniciado un nuevo Proceso de Evaluación en JUARDI. Hacé
            click en el siguiente link para completar tu evaluación 360°.
          </p>
          ${footer(data.link)}`,
      };

    case NEW_GOAL:
      return {
        subject: `Nuevo Objetivo ${data.group ? 'grupal' : ''} asignado.`,
        text: `Nuevo Objetivo ${data.group ? 'grupal' : ''} asignado`,
        html: `${header(data.name)}
          <p>${data.userAsign}, 
            acaba de asignarte un nuevo objetivo ${
              data.group ? 'grupal' : ''
            } para
            el actual periodo a evaluar. Hacé click en el siguiente link para poder 
            empezar a analizarlo y sacarte todas las dudas lo antes posible.
          </p>
          ${footer(data.link)}`,
      };
  }
};

module.exports = createEmailTemplate;
