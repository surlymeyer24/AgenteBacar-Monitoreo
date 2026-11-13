const { setGlobalOptions } = require("firebase-functions");
const { beforeUserCreated } = require("firebase-functions/v2/identity");
const { HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

setGlobalOptions({ maxInstances: 10 });

/**
 * Restringe el registro en Firebase Authentication exclusivamente
 * a cuentas pertenecientes a la organización corporativa (@bacarsa.com.ar o @bacarsa.com).
 */
exports.validarDominioCorporativo = beforeUserCreated((event) => {
  const user = event.data;
  const email = (user?.email || "").trim().toLowerCase();

  const esCorporativo = email.endsWith("@bacarsa.com.ar") || email.endsWith("@bacarsa.com");

  if (!esCorporativo) {
    logger.warn(`Intento de registro rechazado para email no corporativo: ${email}`);
    throw new HttpsError(
      "permission-denied",
      "Acceso restringido: Solo se permiten registros con cuentas de correo corporativas (@bacarsa.com.ar)."
    );
  }

  logger.info(`Registro corporativo autorizado: ${email}`);
});
