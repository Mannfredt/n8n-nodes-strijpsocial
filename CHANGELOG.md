# Changelog

## 0.1.0

- Initial release.
- **Post** resource: Create, Get, Get Many, Update, Reschedule, Delete.
- **Channel** resource: Get Many.
- Dynamic channel dropdown via the `getChannels` loadOptions method.
- Credential test against `GET /channels`.
- API errors mapped to readable messages (401 / 403 / 422 / other); supports Continue On Fail.
