# Lecciones aprendidas — CyberWatch

## Firebase Storage
- No usar PredefinedObjectAcl.PublicRead (falla con Uniform access)
- Subir sin ACL + generar signed URL
- Firestore: usar SetAsync(MergeAll), no UpdateAsync

## Machine ID
- No usar Guid.NewGuid() como ID persistente
- Usar UUID de hardware (WMI)
- Fallback: GUID guardado en archivo

## Seguridad (Firebase / Google)
- Nunca commitear serviceAccountKey.json
- Si se expone:
  1. Revocar clave
  2. Generar nueva
  3. Limpiar historial git
