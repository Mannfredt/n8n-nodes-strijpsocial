# n8n-nodes-strijpsocial

This is an n8n community node. It lets you use [StrijpSocial](https://strijpsocial.com) in your n8n workflows.

StrijpSocial is a multi-platform social media scheduler. This node schedules and publishes posts across your connected social channels, manages the posting queue, and reads back your connected channels — all driven from an n8n workflow.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Credentials](#credentials)
[Operations](#operations)
[Dynamic channel dropdown](#dynamic-channel-dropdown)
[Error handling](#error-handling)
[Example workflow](#example-workflow)
[Resources](#resources)

## Installation

### Community Nodes (recommended)

For users on n8n v0.187+, install directly from the UI:

1. Go to **Settings → Community Nodes**.
2. Select **Install**.
3. Enter `n8n-nodes-strijpsocial` as the npm package name.
4. Agree to the risks of using community nodes and select **Install**.

After installation the **StrijpSocial** node is available in the node panel.

### Manual / npm

Install into your n8n instance's node folder:

```bash
npm install n8n-nodes-strijpsocial
```

For self-hosted Docker setups, see the n8n [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

## Credentials

You need a StrijpSocial API key.

1. Sign in to StrijpSocial.
2. Go to **Settings → API keys**.
3. Create a key. It looks like `ssk_live_...`.
4. In n8n, create new **StrijpSocial API** credentials and paste the key into **API Key**.
5. Leave **Base URL** at `https://strijpsocial.com/api` unless you self-host, in which case point it at your own instance.

The API key is workspace-scoped: every request automatically operates on the workspace the key belongs to. When you save the credentials, n8n verifies them with a live `GET /channels` call — a green check means the key works.

## Operations

### Post

| Operation   | Description                                                        | API call |
|-------------|-------------------------------------------------------------------|----------|
| Create      | Create and schedule a post across one or more channels            | `POST /posts` |
| Get         | Fetch a single post by ID                                         | `GET /posts/{id}` |
| Get Many    | List posts, with filters for week, status, and channel + a limit  | `GET /posts` |
| Update      | Update body, label, scheduled time, or tags of a post            | `PATCH /posts/{id}` |
| Reschedule  | Change only the scheduled time                                    | `PATCH /posts/{id}/schedule` |
| Delete      | Cancel / delete a post by ID                                      | `DELETE /posts/{id}` |

**Create** highlights:

- **Body** — the post text, used as the default for every selected channel.
- **Channel Names or IDs** — a multi-select loaded live from your account (see below).
- **Scheduled At** — leave empty for a draft.
- **Status** — `draft`, `scheduled`, or `needs_approval`. If you set a scheduled time and leave status at the default `draft`, it is sent as `scheduled`.
- **Tags** — comma-separated hashtags; split into an array before sending.
- **Label** — internal name / YouTube title.
- **Additional Fields** — `timezone`, and **Per-Channel Variants** (a `channel` + `body` pair) to override the body for specific channels.

Every Create request also sends `source: "n8n"`.

### Channel

| Operation | Description                          | API call |
|-----------|--------------------------------------|----------|
| Get Many  | List all connected social channels   | `GET /channels` |

## Dynamic channel dropdown

The **Channel Names or IDs** field (and the per-channel variant selector) is populated at edit time by a `loadOptions` method named `getChannels`. It calls `GET /channels` with your credentials and returns each channel as:

```
name:  "<display_name> (<platform>)"
value: <channel id>
```

So you pick channels by their human-readable name instead of pasting UUIDs, and the underlying post payload still carries the real channel IDs.

### Using channels by name (AI Agent tool)

For AI Agent tools, use the **Channels** field: a comma-separated string of channel names, platforms, handles, or UUIDs (e.g. `bluesky, linkedin`). The model can set it to a UUID **or** a platform name (`bluesky`), handle (`@myhandle`), or display name — the node resolves each to a UUID at request time by matching against `GET /channels` (case-insensitive). If a value matches no channel, or matches more than one, the node throws an error listing the available channels, so the agent can pick correctly. This lets an agent say "post to Bluesky" without knowing any UUIDs.

The **Channels** string field is preferred for agents because the multiOptions **Channel Names or IDs** dropdown can be fed one character at a time by some AI tool layers; the node tolerates that (re-joining character-split input) but the plain-string field avoids the problem entirely. When **Channels** is set it takes precedence over the dropdown. The dropdown remains the convenient choice for manual workflows.

## Error handling

API errors are mapped to readable n8n messages:

- **401** → `Invalid API key — check your StrijpSocial credentials.`
- **403** → `Your API key doesn't have the required scope for this operation.`
- **422** → the validation message returned by the API.
- Other errors surface the API's message with the HTTP status.

The node supports n8n's **Continue On Fail** setting, so a single failed post (for example one channel rejecting a schedule) won't halt a batch — the error is returned as an item and the workflow keeps running.

## Example workflow

A simple "publish from a spreadsheet" workflow:

1. **Schedule Trigger** — run every morning.
2. **Google Sheets → Get rows** — read the day's planned posts (body, channels, time).
3. **StrijpSocial → Post → Create** — map the body, select channels from the dropdown, set **Scheduled At** from the sheet, and add tags. With **Continue On Fail** on, any row that fails is captured without stopping the rest.
4. **Filter / IF** — route failed items (they carry an `error` field) to a Slack notification.

You can also run **Channel → Get Many** first to discover channel IDs dynamically, or use **Post → Get Many** with a `week` filter to build a weekly digest.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [StrijpSocial documentation](https://strijpsocial.com/docs)

## Version history

### 0.1.0

- Initial release: Post (Create, Get, Get Many, Update, Reschedule, Delete) and Channel (Get Many), with dynamic channel loading and mapped error messages.

