from __future__ import annotations

import argparse
import json
import threading
from functools import partial
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


class VisitCounter:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.lock = threading.Lock()

    def _read_unlocked(self) -> int:
        if not self.path.exists():
            return 0
        try:
            payload = json.loads(self.path.read_text(encoding="utf-8"))
            return max(0, int(payload.get("count", 0)))
        except (OSError, ValueError, json.JSONDecodeError):
            return 0

    def current(self) -> int:
        with self.lock:
            return self._read_unlocked()

    def increment(self) -> int:
        with self.lock:
            count = self._read_unlocked() + 1
            self.path.parent.mkdir(parents=True, exist_ok=True)
            temporary_path = self.path.with_suffix(f"{self.path.suffix}.tmp")
            temporary_path.write_text(
                json.dumps({"count": count}, separators=(",", ":")),
                encoding="utf-8",
            )
            temporary_path.replace(self.path)
            return count


class VisitRequestHandler(BaseHTTPRequestHandler):
    server_version = "WondersVisitCounter/1.0"

    def __init__(self, *args, counter: VisitCounter, **kwargs) -> None:
        self.counter = counter
        super().__init__(*args, **kwargs)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path in ("/api/visit", "/api/page-summary"):
            self._send_count(increment=False)
            return
        if path == "/healthz":
            self._send_json({"status": "ok"})
            return
        self._send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length:
            self.rfile.read(content_length)
        path = urlparse(self.path).path
        if path in ("/api/visit", "/api/page-summary"):
            self._send_count(increment=True)
            return
        self._send_json({"error": "Not found"}, HTTPStatus.NOT_FOUND)

    def _send_count(self, *, increment: bool) -> None:
        try:
            count = self.counter.increment() if increment else self.counter.current()
        except (OSError, ValueError, json.JSONDecodeError):
            self._send_json({"error": "Visit count unavailable"}, HTTPStatus.SERVICE_UNAVAILABLE)
            return
        self._send_json({"count": count, "metric": "recorded_page_visits"})

    def _send_json(self, payload: dict[str, object], status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: object) -> None:
        return


class ReusableThreadingHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the Ancient Greek Wonders aggregate visit counter.")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8766)
    parser.add_argument("--count-file", type=Path, required=True)
    arguments = parser.parse_args()

    counter = VisitCounter(arguments.count_file.resolve())
    handler = partial(VisitRequestHandler, counter=counter)
    server = ReusableThreadingHTTPServer((arguments.host, arguments.port), handler)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

