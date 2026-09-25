"""Password hashing, signed session tokens and login throttling (standard library only)."""
import base64
import hashlib
import hmac
import json
import secrets
import threading
import time

_PBKDF2_ITERATIONS = 200_000
_PREFIX = "pbkdf2_sha256"


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _PBKDF2_ITERATIONS)
    return f"{_PREFIX}${_PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def is_hashed(value) -> bool:
    return isinstance(value, str) and value.startswith(_PREFIX + "$")


def verify_password(password: str, stored: str) -> bool:
    if not is_hashed(stored):
        return False
    try:
        _, iterations, salt_hex, digest_hex = stored.split("$")
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations))
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _unb64(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def make_token(secret: str, kind: str, subject: str, ttl_seconds: int) -> tuple[str, int]:
    """Returns (token, expiry unix time). `kind` separates staff tokens from kiosk tokens."""
    exp = int(time.time()) + ttl_seconds
    body = _b64(json.dumps({"k": kind, "s": subject, "e": exp, "n": secrets.token_hex(4)}).encode())
    sig = _b64(hmac.new(secret.encode(), body.encode(), hashlib.sha256).digest())
    return f"{body}.{sig}", exp


def read_token(secret: str, token: str, kind: str):
    """Returns the token's subject if it is valid, unexpired and of the given kind, else None."""
    try:
        body, sig = token.split(".")
        expected = _b64(hmac.new(secret.encode(), body.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(_unb64(body))
        if payload.get("k") != kind or payload.get("e", 0) < time.time():
            return None
        return payload.get("s")
    except (ValueError, TypeError, json.JSONDecodeError):
        return None


class Throttle:
    """Locks a key (e.g. username+IP) for `lock_seconds` after `max_failures` failures."""

    def __init__(self, max_failures: int, lock_seconds: int):
        self.max_failures = max_failures
        self.lock_seconds = lock_seconds
        self._failures: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def seconds_locked(self, key: str) -> int:
        with self._lock:
            now = time.time()
            recent = [t for t in self._failures.get(key, []) if now - t < self.lock_seconds]
            self._failures[key] = recent
            if len(recent) >= self.max_failures:
                return int(self.lock_seconds - (now - recent[0])) + 1
            return 0

    def fail(self, key: str):
        with self._lock:
            self._failures.setdefault(key, []).append(time.time())

    def reset(self, key: str):
        with self._lock:
            self._failures.pop(key, None)
