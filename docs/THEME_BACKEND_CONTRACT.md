# Theme Backend Contract (Production)

## Goal
Persist and return a complete, versioned theme document so client refresh does not fall back to old/default text.

## API

### `GET /v1/theme`
- Returns:
  - `themeSchemaVersion: number`
  - `version: number`
  - `theme: Theme`
- Must always return full normalized `theme` shape (no omitted keys).
- Add `ETag` from `version`.

### `PUT /v1/admin/theme`
- Permission required: `MANAGE_THEME`.
- Accepts partial patch, validates against whitelist.
- Applies safe deep merge into existing theme document.
- Rejects stale writes (`If-Match` or request `version`) with `409`.
- Returns full normalized `theme` and incremented `version`.

## Validation rules
- Reject unknown top-level keys.
- Reject dangerous keys in payload objects:
  - `__proto__`
  - `constructor`
  - `prototype`
- String fields:
  - trim
  - strip control chars
  - max length (for example: 180 for titles, 800 for long text)
- Arrays:
  - `heroStats` max 6
  - `highlights` max 12
  - `promoCards` max 12
- `promoCards[].enabled` must be boolean.

## Persistence rules
- Store metadata:
  - `themeSchemaVersion`
  - `version`
  - `updatedAt`
  - `updatedBy`
- On write success:
  - invalidate theme cache
  - write audit log with actor + diff summary

## Recommended document shape
Use frontend shape from `src/context/ThemeContext.tsx` as schema source of truth:
- `colors`
- `content` (all fields)
- `heroStats`
- `highlights`
- `promoCards`
- `company`

## Migration
1. Backfill existing theme records with missing keys and defaults.
2. Set `themeSchemaVersion` to current version.
3. Deploy read path first, then write path validation, then strict unknown-key rejection.
