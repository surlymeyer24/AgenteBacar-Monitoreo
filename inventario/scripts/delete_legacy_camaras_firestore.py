"""
Borra documentos legacy en Firestore colección «camaras» cuyo ID sigue el patrón antiguo
cam-<octeto>-<octeto>-<octeto>-<octeto> (ej. cam-192-168-1-198).

Uso:
  pip install firebase-admin
  py -3 scripts/delete_legacy_camaras_firestore.py           # solo lista (dry-run)
  py -3 scripts/delete_legacy_camaras_firestore.py --apply    # borra de verdad

Credenciales: por defecto inventario/auth/serviceAccountKey.json (desde la raíz del repo,
ajustá LA RUTA si ejecutás desde inventario/).
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    print("Instalá: pip install firebase-admin", file=sys.stderr)
    sys.exit(1)

# Mismo formato que tenía la importación por IP (cam-192-168-1-198)
LEGACY_CAM_IP = re.compile(r"^cam-\d+-\d+-\d+-\d+$")

# Firestore permite hasta 500 operaciones por batch; dejamos margen.
BATCH_SIZE = 450


def default_key_path() -> Path:
    here = Path(__file__).resolve().parent
    inv = here.parent  # inventario/
    cand = inv / "auth" / "serviceAccountKey.json"
    return cand


def main() -> None:
    p = argparse.ArgumentParser(description="Elimina cámaras legacy en Firestore (dry-run por defecto).")
    p.add_argument(
        "--credentials",
        type=Path,
        default=None,
        help=f"JSON service account (default: {default_key_path()})",
    )
    p.add_argument("--collection", default="camaras", help="Nombre colección Firestore")
    p.add_argument(
        "--apply",
        action="store_true",
        help="Sin esto solo imprime IDs; con --apply borra.",
    )
    args = p.parse_args()

    key = args.credentials or default_key_path()
    if not key.is_file():
        print(f"No existe el archivo de credenciales: {key}", file=sys.stderr)
        sys.exit(1)

    cred = credentials.Certificate(str(key))
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    col = db.collection(args.collection)

    borrar = []
    for snap in col.stream():
        doc_id = snap.id
        if LEGACY_CAM_IP.match(doc_id):
            borrar.append(doc_id)

    borrar.sort()
    if not borrar:
        print("No hay documentos con ID legacy cam-<ip>. Nada que hacer.")
        return

    modo = "BORRAR (--apply)" if args.apply else "dry-run (sin --apply no se borra nada)"
    print(f"Modo: {modo}")
    print(f"Colección: {args.collection}")
    print(f"Documentos a borrar ({len(borrar)}):")
    for did in borrar:
        print(f"  - {did}")

    if args.apply:
        total = len(borrar)
        commit_idx = 0
        try:
            for start in range(0, total, BATCH_SIZE):
                chunk = borrar[start : start + BATCH_SIZE]
                batch = db.batch()
                for did in chunk:
                    batch.delete(col.document(did))
                batch.commit()
                commit_idx += len(chunk)
                print(f"  … borrados {commit_idx}/{total}")
        except KeyboardInterrupt:
            print(
                f"\nInterrumpido (Ctrl+C). Borrados hasta ~{commit_idx} de {total}. "
                "Volvé a ejecutar con --apply para intentar borrar los que falten.",
                file=sys.stderr,
            )
            sys.exit(130)
        print(f"\nListo: borrados {total} documentos.")
    else:
        print(f"\nPara borrar en serio ejecutá de nuevo con --apply")


if __name__ == "__main__":
    main()
