package com.bacarsa.inventario.util;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentReference;

/**
 * Convierte valores típicos de Firestore a estructuras serializables en JSON (REST).
 */
public final class FirestoreJsonHelper {

    private FirestoreJsonHelper() {
    }

    public static Object toJsonFriendly(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Timestamp) {
            return ((Timestamp) value).toDate().toInstant().toString();
        }
        if (value instanceof DocumentReference) {
            return ((DocumentReference) value).getPath();
        }
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> copy = new LinkedHashMap<>();
            for (Map.Entry<?, ?> e : map.entrySet()) {
                copy.put(String.valueOf(e.getKey()), toJsonFriendly(e.getValue()));
            }
            return copy;
        }
        if (value instanceof List<?> list) {
            List<Object> copy = new ArrayList<>(list.size());
            for (Object item : list) {
                copy.add(toJsonFriendly(item));
            }
            return copy;
        }
        return value;
    }
}
