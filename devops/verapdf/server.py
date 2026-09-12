#!/usr/bin/env python3
"""Small task-local HTTP wrapper around the veraPDF CLI."""

from __future__ import annotations

import base64
import binascii
import json
import os
import re
import subprocess
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8011"))
MAX_PDF_BYTES = int(os.environ.get("VERAPDF_MAX_PDF_BYTES", str(10 * 1024 * 1024)))
MAX_JSON_BYTES = 14 * 1024 * 1024 + 4096
TIMEOUT_SECONDS = float(os.environ.get("VERAPDF_TIMEOUT_SECONDS", "30"))
VERAPDF = os.environ.get("VERAPDF_BIN", "/opt/verapdf/verapdf")
SAFE_FILENAME = re.compile(r"[^A-Za-z0-9._-]+")


def read_engine_version() -> str:
    completed = subprocess.run([VERAPDF, "--version"], capture_output=True, text=True, timeout=10, check=False)
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or "veraPDF is not runnable.")
    return completed.stdout.strip() or "veraPDF"


ENGINE_VERSION = read_engine_version()


class RequestError(Exception):
    def __init__(self, code: str, message: str, status: int = 400):
        super().__init__(message)
        self.code = code
        self.status = status


def _first_number(value: Any, keys: set[str]) -> int | None:
    if isinstance(value, dict):
        for key, child in value.items():
            if key in keys and isinstance(child, (int, float)) and not isinstance(child, bool):
                return int(child)
        for child in value.values():
            found = _first_number(child, keys)
            if found is not None:
                return found
    elif isinstance(value, list):
        for child in value:
            found = _first_number(child, keys)
            if found is not None:
                return found
    return None


def _first_bool(value: Any, keys: set[str]) -> bool | None:
    if isinstance(value, dict):
        for key, child in value.items():
            if key in keys and isinstance(child, bool):
                return child
        for child in value.values():
            found = _first_bool(child, keys)
            if found is not None:
                return found
    elif isinstance(value, list):
        for child in value:
            found = _first_bool(child, keys)
            if found is not None:
                return found
    return None


def _failures(value: Any) -> list[dict[str, str]]:
    failures: list[dict[str, str]] = []

    def visit(node: Any) -> None:
        if isinstance(node, dict):
            status = str(node.get("status", "")).lower()
            failed = status in {"failed", "fail", "false"} or node.get("passed") is False
            if failed:
                rule_id = node.get("ruleId") or node.get("rule") or node.get("testNumber") or node.get("id")
                description = node.get("description") or node.get("message") or node.get("test")
                if rule_id or description:
                    failures.append({
                        "ruleId": str(rule_id or ""),
                        "clause": str(node.get("clause") or node.get("clauseId") or ""),
                        "description": str(description or "PDF/UA requirement failed."),
                        "specification": str(node.get("specification") or node.get("profile") or "ISO 14289-1"),
                        "location": str(node.get("location") or node.get("object") or node.get("context") or ""),
                        "context": str(node.get("context") or node.get("details") or ""),
                    })
            for child in node.values():
                visit(child)
        elif isinstance(node, list):
            for child in node:
                visit(child)

    visit(value)
    return failures


def validate_pdf(payload: dict[str, Any]) -> dict[str, Any]:
    encoded = payload.get("file")
    if not isinstance(encoded, str) or not encoded:
        raise RequestError("missing_file", "The file field must contain a base64-encoded PDF.")

    try:
        pdf = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError):
        raise RequestError("invalid_pdf", "The file field is not valid base64.") from None

    if len(pdf) > MAX_PDF_BYTES:
        raise RequestError("pdf_too_large", "The decoded PDF exceeds the 10 MB limit.", 413)
    if not pdf.startswith(b"%PDF-"):
        raise RequestError("invalid_pdf", "The decoded file is not a PDF.")

    filename = str(payload.get("filename") or "document.pdf")
    filename = SAFE_FILENAME.sub("_", os.path.basename(filename))[:120] or "document.pdf"
    if not filename.lower().endswith(".pdf"):
        filename += ".pdf"

    path = ""
    try:
        with tempfile.NamedTemporaryFile(prefix="openada-", suffix=f"-{filename}", delete=False) as temporary:
            temporary.write(pdf)
            path = temporary.name
        completed = subprocess.run(
            [VERAPDF, "--format", "json", "-f", "ua1", path],
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired:
        raise RequestError("pdf_check_timeout", "PDF/UA validation exceeded the 30-second limit.", 504) from None
    finally:
        if path:
            try:
                os.unlink(path)
            except FileNotFoundError:
                pass

    try:
        report = json.loads(completed.stdout)
    except json.JSONDecodeError:
        detail = completed.stderr.strip().replace(path, "<pdf>")[-1000:]
        raise RequestError("pdf_check_failed", detail or "veraPDF returned an invalid report.", 502) from None

    failures = _failures(report)
    failed_count = _first_number(report, {"failedChecks", "failedChecksCount", "failedRules", "failedJobs"})
    passed_count = _first_number(report, {"passedChecks", "passedChecksCount", "passedRules"})
    compliant = _first_bool(report, {"isCompliant", "compliant", "isValid"})
    if failed_count is None:
        failed_count = len(failures)
    if passed_count is None:
        passed_count = 0
    if compliant is None:
        compliant = completed.returncode == 0 and failed_count == 0

    return {
        "compliant": compliant,
        "profile": "ua1",
        "passedChecksCount": passed_count,
        "failedChecksCount": failed_count,
        "failures": failures,
        "raw": report,
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "OpenADA-veraPDF/1.0"

    def _json(self, status: int, body: dict[str, Any]) -> None:
        encoded = json.dumps(body, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self) -> None:  # noqa: N802
        if self.path != "/health":
            self._json(404, {"error": {"code": "not_found", "message": "Not found."}})
            return
        self._json(200, {"status": "ok", "engine": ENGINE_VERSION})

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/check":
            self._json(404, {"error": {"code": "not_found", "message": "Not found."}})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_JSON_BYTES:
                raise RequestError("payload_too_large", "The JSON request exceeds the allowed size.", 413)
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise RequestError("invalid_request", "The request body must be a JSON object.")
            self._json(200, validate_pdf(payload))
        except RequestError as error:
            self._json(error.status, {"error": {"code": error.code, "message": str(error)}})
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._json(400, {"error": {"code": "invalid_json", "message": "The request body is not valid JSON."}})
        except Exception:
            self._json(500, {"error": {"code": "internal_error", "message": "PDF validation failed unexpectedly."}})

    def log_message(self, message: str, *args: Any) -> None:
        print(f'{self.address_string()} - {message % args}', flush=True)


if __name__ == "__main__":
    print(f"OpenADA veraPDF sidecar listening on {HOST}:{PORT}", flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
