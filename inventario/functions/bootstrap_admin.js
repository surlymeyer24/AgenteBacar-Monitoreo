/**
 * Bootstrap / actualización de rol en Firestore (colección usuarios).
 *
 * Uso (desde inventario/functions):
 *   node bootstrap_admin.js
 *   node bootstrap_admin.js desarrollo.it@bacarsa.com.ar
 *   node bootstrap_admin.js desarrollo.it@bacarsa.com.ar ADMINISTRADOR
 *   node bootstrap_admin.js usuario@bacarsa.com.ar USUARIO
 *
 * Requisitos:
 *   - auth/serviceAccountKey.json (relativo a inventario/)
 *   - npm install en functions/ (firebase-admin)
 *   - La cuenta debe existir en Firebase Authentication
 */

const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

const EMAIL_DEFAULT = 'desarrollo.it@bacarsa.com.ar';
const ROL_DEFAULT = 'ADMINISTRADOR';
const ROLES_VALIDOS = new Set(['ADMINISTRADOR', 'USUARIO', 'VISUALIZADOR']);

const email = (process.argv[2] || EMAIL_DEFAULT).trim().toLowerCase();
const rol = (process.argv[3] || ROL_DEFAULT).trim().toUpperCase();

if (!ROLES_VALIDOS.has(rol)) {
  console.error(`Rol inválido: ${rol}`);
  console.error(`Válidos: ${[...ROLES_VALIDOS].join(', ')}`);
  process.exit(1);
}

const keyPath = path.resolve(__dirname, '../auth/serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
  console.error('No se encontró serviceAccountKey.json en:');
  console.error(`  ${keyPath}`);
  process.exit(1);
}

const serviceAccount = require(keyPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function main() {
  console.log(`Buscando cuenta Firebase Auth: ${email}`);

  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
  } catch (err) {
    if (err?.code === 'auth/user-not-found') {
      console.error('No existe esa cuenta en Firebase Authentication.');
      console.error('Registrate primero en /login y volvé a correr el script.');
      process.exit(1);
    }
    throw err;
  }

  const uid = user.uid;
  const nombre =
    (user.displayName && user.displayName.trim()) ||
    email.split('@')[0];

  const ref = db.collection('usuarios').doc(uid);
  const prev = await ref.get();

  const data = {
    nombre: prev.exists && prev.get('nombre') ? prev.get('nombre') : nombre,
    email: user.email || email,
    rol,
    activo: true,
  };

  await ref.set(data, { merge: true });

  console.log(prev.exists ? 'Usuario actualizado:' : 'Usuario creado:');
  console.log(`  uid:    ${uid}`);
  console.log(`  email:  ${data.email}`);
  console.log(`  nombre: ${data.nombre}`);
  console.log(`  rol:    ${data.rol}`);
  console.log(`  activo: ${data.activo}`);
  console.log('');
  console.log('Listo. Si el backend estaba corriendo, reinicialo (o esperá ~3 min)');
  console.log('para invalidar la caché de usuarios, después cerrá sesión y volvé a entrar.');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
