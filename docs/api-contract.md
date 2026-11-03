# PREDRIVE AI API contract — MVP v0.1

All timestamps are ISO 8601 with timezone; the backend normalizes them to UTC. Session metadata is in-memory only. No raw frames are stored.

## Health and session

- `GET /health` → `{"status":"ok","service":"predrive-backend","version":"0.1.0"}`
- `POST /api/v1/sessions` → HTTP 201 with `session_id` (UUID), `created_at`, and `expires_at`.
- `WS /ws/monitor?session_id=<UUID>` accepts one active connection per session. Unknown/expired sessions close with policy code 1008.

## Client frame

Send one JSON object per WebSocket message:

```json
{"type":"frame","session_id":"550e8400-e29b-41d4-a716-446655440000","frame_id":12,"captured_at":"2026-11-02T03:00:00.000Z","image_format":"jpeg","image_base64":"<base64-jpeg>"}
```

The server requires strictly increasing frame IDs, a recent timestamp, valid base64 containing a JPEG, image dimensions within configured limits, at most 2 MiB decoded by default, and no more than 5 frames per rolling second by default. Invalid frames produce `{"type":"error","code":"INVALID_FRAME","detail":"..."}` and are not analyzed.

## Mock result

Accepted frames receive:

```json
{"type":"analysis_result","session_id":"550e8400-e29b-41d4-a716-446655440000","frame_id":12,"captured_at":"2026-11-02T03:00:00.000Z","processed_at":"2026-11-02T03:00:00.120Z","model_version":"mock-v0","state":"NOT_EVALUATED","alert_level":"NONE","face_visible":null,"image_quality":"UNKNOWN","risk_score":null,"processing_ms":0}
```

The mock must never be presented as a real detection or trigger an AI safety alert. If camera/network/server monitoring becomes unreliable, the client should show `MONITORING_UNAVAILABLE` with a technical reason; this gateway does not infer driver state.

## Development and deployment boundary

This unauthenticated contract is for controlled local/LAN development only. Public deployment requires authenticated sessions, authorization checks, HTTPS/WSS, rate and body limits at the edge, restricted CORS origins, secret management, and privacy/retention controls. Do not send real driver identity as trusted client metadata. Do not persist raw video by default.
