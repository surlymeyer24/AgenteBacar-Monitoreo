package com.bacarsa.inventario.repository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import com.bacarsa.inventario.models.Nvr;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.DocumentReference;

import com.google.cloud.firestore.Firestore;



@Repository
public class NvrRepository {

    private final Firestore firestore;
    private final String collectionName;

    public NvrRepository(Firestore firestore,
        @Value("${firebase.collection.nvrs}") String collectionName) {
        this.firestore = firestore;
        this.collectionName = collectionName;
    }

    public List<Nvr> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(collectionName).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Nvr> result = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            result.add(snapshotToNvr(doc));
        }
        return result;
    }

    public Nvr findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = firestore.collection(collectionName).document(id).get().get();
        if (!doc.exists()) {
            return null;
        }
        return snapshotToNvr(doc);
    }

    private Nvr snapshotToNvr(DocumentSnapshot doc) {
        Nvr nvr = doc.toObject(Nvr.class);
        if (nvr != null) {
            nvr.setId(doc.getId());
        }
        return nvr;
    }

    public void guardarConId(String id, Nvr nvr) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection(collectionName).document(id);
        nvr.setId(id); // Aseguramos que el ID del objeto coincida con el ID del documento
        docRef.set(nvr).get(); // Esperamos a que se complete la operación
    }
}
