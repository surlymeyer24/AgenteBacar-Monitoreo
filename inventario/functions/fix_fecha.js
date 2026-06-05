const admin = require('firebase-admin');

const serviceAccount = require('../auth/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function removeFechaAlta() {
  const collections = ['routers', 'switches'];
  for (const coll of collections) {
    const snapshot = await db.collection(coll).get();
    const batch = db.batch();
    let count = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.fecha_alta !== undefined) {
        batch.update(doc.ref, {
          fecha_alta: admin.firestore.FieldValue.delete()
        });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log('Removed fecha_alta from ' + count + ' documents in ' + coll);
    } else {
      console.log('No documents with fecha_alta found in ' + coll);
    }
  }
}

removeFechaAlta().then(() => {
  console.log('Done.');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
