"""hmx-hermes-pack — Hermes Agent icinden HMX Agent'i cagiran kopru eklentisi.

HMX dashboard sunucusu calisiyor olmali (varsayilan http://localhost:4173;
HMX_DASHBOARD_URL ile ezilebilir). Hermes tarafina iki arac ekler:

- hmx_generate(kind, prompt, ...)  -> POST /api/generate (kota rotasyonu + fallback HMX'te)
- hmx_accounts()                   -> GET /api/accounts (havuz durumu)

Hermes eklenti sozlesmesi: plugins/AGENTS.md — register(ctx) + ctx.register_tool.
"""

from __future__ import annotations

import json
import os
import urllib.request
import urllib.error

_BASE = os.environ.get("HMX_DASHBOARD_URL", "http://localhost:4173").rstrip("/")


def _hmx_reachable() -> bool:
    """check_fn: dashboard ayakta mi? (erisilebilirlik/opt-in kontrolu)"""
    try:
        with urllib.request.urlopen(f"{_BASE}/api/health", timeout=3) as res:
            return res.status == 200
    except Exception:
        return False


def _post(path: str, payload: dict) -> dict:
    req = urllib.request.Request(
        f"{_BASE}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=600) as res:
        return json.loads(res.read().decode("utf-8"))


def _get(path: str) -> object:
    with urllib.request.urlopen(f"{_BASE}{path}", timeout=30) as res:
        return json.loads(res.read().decode("utf-8"))


def _hmx_generate(kind: str, prompt: str, preferred: str = "", tags: list | None = None, **_: object) -> str:
    """HMX uzerinden medya uret: kind=image|video|audio."""
    try:
        out = _post("/api/generate", {"kind": kind, "prompt": prompt, "preferred": preferred or None, "tags": tags or []})
    except urllib.error.HTTPError as e:
        return f"HMX uretim hatasi (HTTP {e.code}): {e.read().decode('utf-8', 'replace')[:500]}"
    except Exception as e:
        return f"HMX ulasilamadi: {e}"
    if not out.get("ok"):
        return f"Uretim basarisiz: {out.get('error', '(hata yok)')}"
    asset = out.get("asset", {})
    return f"Uretildi: {asset.get('filePath')} ({asset.get('bytes')} bayt, saglayici: {asset.get('provider')})"


def _hmx_accounts(**_: object) -> str:
    """HMX hesap havuzunun durumu (aktif/cooldown/hata)."""
    try:
        rows = _get("/api/accounts")
    except Exception as e:
        return f"HMX ulasilamadi: {e}"
    if not rows:
        return "Havuz bos."
    return "\n".join(
        f"- {r['provider']}/{r['id']}: {r['status']} (hata: {r['failCount']})" for r in rows
    )


_TOOLS = [
    (
        "hmx_generate",
        {
            "type": "object",
            "properties": {
                "kind": {"type": "string", "enum": ["image", "video", "audio"]},
                "prompt": {"type": "string"},
                "preferred": {"type": "string", "description": "Tercih edilen saglayici id (opsiyonel)"},
            },
            "required": ["kind", "prompt"],
        },
        _hmx_generate,
        "HMX Agent uzerinden medya uret (coklu hesap + kota rotasyonu + fallback zinciri HMX tarafinda).",
        "🎬",
    ),
    (
        "hmx_accounts",
        {"type": "object", "properties": {}},
        _hmx_accounts,
        "HMX hesap havuzunun durumunu goster (aktif/cooldown/hata).",
        "🔌",
    ),
]


def register(ctx) -> None:
    for name, schema, handler, description, emoji in _TOOLS:
        ctx.register_tool(
            name=name,
            toolset="hmx",
            schema=schema,
            handler=handler,
            check_fn=_hmx_reachable,
            emoji=emoji,
            description=description,
        )
