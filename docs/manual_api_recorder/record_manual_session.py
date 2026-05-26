from __future__ import annotations

import argparse
import json
import os
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright


STATIC_SUFFIXES = (
    ".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff",
    ".woff2", ".ttf", ".eot", ".map", ".mp4", ".webm", ".pdf", ".doc",
    ".docx", ".zip", ".rar",
)


def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _is_static_url(url: str) -> bool:
    path = urlsplit(url).path.lower()
    return path.endswith(STATIC_SUFFIXES)


def _normalize_path(url: str) -> str:
    parsed = urlsplit(url)
    parts = []
    for item in (parsed.path or "/").rstrip("/").split("/"):
        if not item:
            continue
        if item.isdigit():
            parts.append(":id")
        else:
            parts.append(item)
    return "/" + "/".join(parts) if parts else "/"


def _request_key(request) -> str:
    post_data = getattr(request, "post_data", "") or ""
    return f"{request.method.upper()}|{request.url}|{post_data[:200]}"


def _is_likely_api(request) -> bool:
    url = request.url
    if not url or _is_static_url(url):
        return False
    resource_type = getattr(request, "resource_type", "") or ""
    if resource_type in {"xhr", "fetch", "eventsource", "websocket"}:
        return True
    path = urlsplit(url).path.lower()
    return "/api/" in path or path.startswith("/api") or path.endswith(".json")


def _build_summary(requests_log: List[Dict[str, Any]]) -> Dict[str, Any]:
    unique = {}
    for item in requests_log:
        key = f"{item['method']} {item['path']}"
        if key not in unique:
            unique[key] = {
                "method": item["method"],
                "path": item["path"],
                "url": item["url"],
                "status_code": item.get("status_code"),
                "status_text": item.get("status_text", ""),
                "sample_query": item.get("query", ""),
                "sample_body": item.get("post_data", ""),
                "resource_type": item.get("resource_type", ""),
                "first_seen": item.get("timestamp", ""),
            }
    return {
        "total_requests": len(requests_log),
        "unique_endpoints": len(unique),
        "methods": dict(Counter(item["method"] for item in requests_log)),
        "status_codes": dict(Counter(str(item.get("status_code")) for item in requests_log if item.get("status_code") is not None)),
        "endpoints": list(unique.values()),
    }


def record_manual_session(url: str, output_dir: str, timeout: int = 5000) -> Dict[str, Path]:
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    har_path = out_dir / "manual_session.har"
    raw_json_path = out_dir / "manual_capture_raw.json"
    summary_json_path = out_dir / "manual_capture_summary.json"
    summary_md_path = out_dir / "manual_capture_summary.md"

    state: Dict[str, Any] = {
        "requests": [],
        "pending": {},
        "seen_keys": set(),
        "websockets": [],
        "ws_frames": [],
    }

    chrome_path = os.environ.get("CHROME_PATH") or r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not Path(chrome_path).exists():
        raise FileNotFoundError(f"未找到本机 Chrome: {chrome_path}，请确认已安装 Chrome，或设置环境变量 CHROME_PATH")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, executable_path=chrome_path)
        context = browser.new_context(
            ignore_https_errors=True,
            record_har_path=str(har_path),
            record_har_content="embed",
        )
        page = context.new_page()

        def on_request(request):
            if not _is_likely_api(request):
                return
            key = _request_key(request)
            if key in state["seen_keys"]:
                return
            state["seen_keys"].add(key)
            entry = {
                "key": key,
                "method": request.method.upper(),
                "url": request.url,
                "path": _normalize_path(request.url),
                "query": urlsplit(request.url).query,
                "resource_type": getattr(request, "resource_type", ""),
                "request_headers": dict(getattr(request, "headers", {}) or {}),
                "post_data": getattr(request, "post_data", "") or "",
                "timestamp": _now(),
                "status_code": None,
            }
            state["requests"].append(entry)
            state["pending"][key] = entry

        def on_response(response):
            req = response.request
            if not _is_likely_api(req):
                return
            key = _request_key(req)
            entry = state["pending"].get(key)
            if not entry or entry.get("status_code") is not None:
                return
            entry["status_code"] = response.status
            entry["status_text"] = response.status_text
            entry["response_headers"] = dict(response.headers)
            try:
                entry["response_body"] = response.text()[:1200]
            except Exception:
                entry["response_body"] = ""

        def on_websocket(ws):
            state["websockets"].append({"url": ws.url, "timestamp": _now()})
            try:
                ws.on("framesent", lambda f: state["ws_frames"].append({"url": ws.url, "direction": "sent", "payload": str(getattr(f, 'payload', f))[:1200], "timestamp": _now()}))
                ws.on("framereceived", lambda f: state["ws_frames"].append({"url": ws.url, "direction": "received", "payload": str(getattr(f, 'payload', f))[:1200], "timestamp": _now()}))
            except Exception:
                pass

        page.on("request", on_request)
        page.on("response", on_response)
        page.on("websocket", on_websocket)

        page.goto(url, wait_until="load", timeout=timeout * 3)
        print("=" * 60)
        print("Manual API Recorder")
        print(f"Target: {url}")
        print("浏览器已打开，请手工操作目标系统。")
        print("完成后请直接关闭浏览器窗口，脚本会自动整理抓包结果。")
        print("=" * 60)
        page.wait_for_event("close", timeout=0)
        context.close()
        browser.close()

    raw_payload = {
        "capture_info": {
            "target_url": url,
            "capture_time": _now(),
            "mode": "manual+proxy",
        },
        "requests": state["requests"],
        "websockets": state["websockets"],
        "ws_frames": state["ws_frames"],
    }
    summary = _build_summary(state["requests"])
    raw_json_path.write_text(json.dumps(raw_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    summary_json_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    md_lines = [
        "# Manual Capture Summary",
        "",
        f"- target: `{url}`",
        f"- total requests: `{summary['total_requests']}`",
        f"- unique endpoints: `{summary['unique_endpoints']}`",
        "",
        "## Methods",
    ]
    for k, v in sorted(summary["methods"].items(), key=lambda x: (-x[1], x[0])):
        md_lines.append(f"- {k}: {v}")
    md_lines += ["", "## Status Codes"]
    for k, v in sorted(summary["status_codes"].items(), key=lambda x: (int(x[0]) if x[0].isdigit() else 999, x[0])):
        md_lines.append(f"- {k}: {v}")
    md_lines += ["", "## Endpoints"]
    for item in summary["endpoints"]:
        md_lines.append(f"- {item['method']} {item['path']} [{item.get('status_code')}]")
    summary_md_path.write_text("\n".join(md_lines) + "\n", encoding="utf-8")

    return {
        "har": har_path,
        "raw_json": raw_json_path,
        "summary_json": summary_json_path,
        "summary_md": summary_md_path,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Manual API recorder via visible browser + HAR + request hooks")
    parser.add_argument("--url", required=True, help="target website URL")
    parser.add_argument("--output-dir", required=True, help="output directory")
    parser.add_argument("--timeout", type=int, default=5000)
    args = parser.parse_args()

    outputs = record_manual_session(args.url, args.output_dir, timeout=args.timeout)
    for path in outputs.values():
        print(path)


if __name__ == "__main__":
    main()
