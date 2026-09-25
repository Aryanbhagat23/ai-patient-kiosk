"""Face recognition: image decoding, embeddings, matching and optional liveness check."""
import base64
import json
import logging
import os
import threading

import numpy as np

import config

log = logging.getLogger("kiosk.face")

try:
    import cv2
    from deepface import DeepFace
    _IMPORT_ERROR = None
except Exception as e:  # pragma: no cover - depends on the install
    cv2 = DeepFace = None
    _IMPORT_ERROR = str(e)

# DeepFace/TensorFlow are not guaranteed thread-safe; FastAPI runs sync endpoints in a pool.
_lock = threading.Lock()
_state = {"status": "loading", "message": "Starting face recognition..."}
_liveness_available = False


class FaceError(Exception):
    """Raised with a machine-readable code: no_face, bad_image, spoof, unavailable."""

    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


def status() -> dict:
    return {"status": _state["status"], "message": _state["message"],
            "liveness": config.ENABLE_LIVENESS and _liveness_available}


def is_ready() -> bool:
    return _state["status"] == "ready"


def _check_install():
    if DeepFace is None:
        return f"DeepFace is not installed ({_IMPORT_ERROR})."
    cascade = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
    if config.FACE_DETECTOR == "opencv" and not os.path.isfile(cascade):
        return "OpenCV is missing its face-detector files. Reinstall with 'opencv-python<5'."
    return None


def warm_up():
    """Load the models once in the background so the first patient doesn't wait."""
    global _liveness_available
    problem = _check_install()
    if problem:
        _state.update(status="unavailable", message=problem)
        log.error("Face recognition unavailable: %s", problem)
        return
    try:
        with _lock:
            dummy = np.zeros((160, 160, 3), dtype=np.uint8)
            DeepFace.represent(img_path=dummy, model_name=config.FACE_MODEL,
                               detector_backend=config.FACE_DETECTOR, enforce_detection=False)
        if config.ENABLE_LIVENESS:
            try:
                import torch  # noqa: F401  (anti-spoofing model needs it)
                _liveness_available = True
            except ImportError:
                log.warning("ENABLE_LIVENESS=1 but torch is not installed; liveness check disabled.")
        _state.update(status="ready", message="Face recognition ready.")
        log.info("Face recognition ready (%s + %s).", config.FACE_MODEL, config.FACE_DETECTOR)
    except Exception as e:
        _state.update(status="unavailable", message=f"Could not load face model: {e}")
        log.exception("Face model failed to load")


def decode_image(data_url: str) -> np.ndarray:
    """Decode a base64 (optionally data-URL) JPEG/PNG into a BGR image, validating it."""
    if not data_url or not isinstance(data_url, str):
        raise FaceError("bad_image")
    payload = data_url.split(",", 1)[1] if data_url.startswith("data:") else data_url
    try:
        raw = base64.b64decode(payload, validate=True)
    except (ValueError, TypeError):
        raise FaceError("bad_image")
    if not raw or len(raw) > config.MAX_IMAGE_BYTES:
        raise FaceError("bad_image")
    if cv2 is None:
        raise FaceError("unavailable")
    img = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    if img is None or img.shape[0] < 64 or img.shape[1] < 64:
        raise FaceError("bad_image")
    return img


def embed(img: np.ndarray) -> list[float]:
    """Unit-length embedding of the largest face in the image."""
    if not is_ready():
        raise FaceError("unavailable")
    with _lock:
        try:
            faces = DeepFace.represent(img_path=img, model_name=config.FACE_MODEL,
                                       detector_backend=config.FACE_DETECTOR,
                                       enforce_detection=True, align=True)
        except ValueError:  # DeepFace raises ValueError when no face is detected
            raise FaceError("no_face")
    if not faces:
        raise FaceError("no_face")
    face = max(faces, key=lambda f: f["facial_area"]["w"] * f["facial_area"]["h"])
    if face["facial_area"]["w"] < 60:  # too small / too far from the camera
        raise FaceError("no_face")
    vec = np.asarray(face["embedding"], dtype=np.float64)
    norm = np.linalg.norm(vec)
    if not norm:
        raise FaceError("no_face")
    return (vec / norm).tolist()


def check_liveness(img: np.ndarray):
    """Raise FaceError('spoof') if the anti-spoofing model thinks the face is a photo/screen."""
    if not (config.ENABLE_LIVENESS and _liveness_available):
        return
    with _lock:
        try:
            faces = DeepFace.extract_faces(img_path=img, detector_backend=config.FACE_DETECTOR,
                                           enforce_detection=True, anti_spoofing=True)
        except ValueError:
            raise FaceError("no_face")
    if not faces or not all(f.get("is_real", True) for f in faces):
        raise FaceError("spoof")


def similarity(a: list[float], b_json: str) -> float:
    if not b_json:
        return 0.0
    try:
        b = np.asarray(json.loads(b_json), dtype=np.float64)
        a = np.asarray(a, dtype=np.float64)
        if a.shape != b.shape:
            return 0.0
        denom = np.linalg.norm(a) * np.linalg.norm(b)
        return float(np.dot(a, b) / denom) if denom else 0.0
    except (ValueError, TypeError):
        return 0.0


def save_photo(img: np.ndarray, patient_id: str) -> str:
    """Re-encode as JPEG (strips metadata). Returns the path relative to the backend folder."""
    os.makedirs(config.IMAGES_DIR, exist_ok=True)
    cv2.imwrite(os.path.join(config.IMAGES_DIR, f"{patient_id}.jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    return f"images/{patient_id}.jpg"


def photo_file(image_path: str):
    """Absolute path of a stored photo, only if it lives inside the images folder."""
    if not image_path:
        return None
    name = os.path.basename(image_path.replace("\\", "/"))
    path = os.path.join(config.IMAGES_DIR, name)
    return path if name and os.path.isfile(path) else None


def delete_photo(image_path: str):
    path = photo_file(image_path)
    if path:
        os.remove(path)
