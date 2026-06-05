const admin = require('firebase-admin');

const serviceAccount = require('../auth/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkType() {
  const camaras = await db.collection('camaras').limit(1).get();
  if (!camaras.empty) {
    const data = camaras.docs[0].data();
    console.log('Camara fecha_alta type:', typeof data.fecha_alta, data.fecha_alta);
  } else {
    console.log('No camaras found.');
  }

  const maquinas = await db.collection('maquinas_tesoreria').limit(1).get();
  if (!maquinas.empty) {
    const data = maquinas.docs[0].data();
    console.log('Maquina fecha_alta type:', typeof data.fecha_alta, data.fecha_alta);
  }

  process.exit(0);
}

checkType();
