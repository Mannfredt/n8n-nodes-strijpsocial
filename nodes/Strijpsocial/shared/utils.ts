import {
	NodeApiError,
	NodeOperationError,
	type IDataObject,
	type IExecuteSingleFunctions,
	type IHttpRequestOptions,
	type IN8nHttpFullResponse,
	type INodeExecutionData,
	type JsonObject,
} from 'n8n-workflow';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Channel {
	id: string;
	platform: string;
	display_name: string;
	handle?: string;
	status?: string;
}

/**
 * postReceive handler shared by every operation. Requires
 * `ignoreHttpStatusErrors: true` on requestDefaults so non-2xx responses reach
 * here instead of throwing generically. Maps StrijpSocial API errors to
 * readable n8n errors.
 */
export async function handleErrors(
	this: IExecuteSingleFunctions,
	data: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const status = response.statusCode;
	if (status < 400) {
		return data;
	}

	const body = (response.body ?? {}) as IDataObject;
	const apiMessage =
		(body.message as string) || (body.error as string) || (body.detail as string);

	let message: string;
	switch (status) {
		case 401:
			message = 'Invalid API key — check your StrijpSocial credentials.';
			break;
		case 403:
			message = "Your API key doesn't have the required scope for this operation.";
			break;
		case 422:
			message = apiMessage || 'Validation failed. Check the values you sent to StrijpSocial.';
			break;
		default:
			message = apiMessage || `StrijpSocial API request failed with status ${status}.`;
	}

	throw new NodeApiError(this.getNode(), body as JsonObject, {
		message,
		httpCode: String(status),
	});
}

/** Split a comma-separated string into a trimmed, non-empty array. */
export function splitTags(raw: string): string[] {
	return raw
		.split(',')
		.map((t) => t.trim())
		.filter((t) => t.length > 0);
}

interface VariantOverride {
	channelId: string;
	body: string;
}

interface CreateAdditionalFields {
	timezone?: string;
	variants?: { variant?: VariantOverride[] };
}

/** Human-readable list of channels for error messages. */
function describeChannels(channels: Channel[]): string {
	if (channels.length === 0) return 'none — no channels are connected to this workspace';
	return channels
		.map((c) => `${c.display_name} (${c.platform}${c.handle ? `, ${c.handle}` : ''})`)
		.join('; ');
}

/** Fetch all channels for the current credentials. */
async function fetchChannels(ctx: IExecuteSingleFunctions): Promise<Channel[]> {
	const credentials = await ctx.getCredentials('strijpsocialApi');
	const response = (await ctx.helpers.httpRequestWithAuthentication.call(ctx, 'strijpsocialApi', {
		method: 'GET',
		baseURL: credentials.baseUrl as string,
		url: '/channels',
	})) as Channel[] | { data: Channel[] };
	return Array.isArray(response) ? response : (response.data ?? []);
}

/**
 * Resolve a single channel reference to a UUID. A value already in UUID form is
 * returned as-is; otherwise it is matched (case-insensitively) against the
 * channel's platform, handle (with or without a leading "@"), or display name.
 * Throws a helpful error listing available channels on no/ambiguous match.
 */
function resolveOne(ctx: IExecuteSingleFunctions, raw: string, channels: Channel[]): string {
	const value = raw.trim();
	if (UUID_RE.test(value)) return value;

	const needle = value.replace(/^@/, '').toLowerCase();
	const matches = channels.filter((c) => {
		const handle = (c.handle ?? '').replace(/^@/, '').toLowerCase();
		return (
			c.platform?.toLowerCase() === needle ||
			handle === needle ||
			c.display_name?.toLowerCase() === needle
		);
	});

	if (matches.length === 1) return matches[0].id;

	if (matches.length === 0) {
		throw new NodeOperationError(
			ctx.getNode(),
			`Channel "${raw}" not found. Available channels: ${describeChannels(channels)}.`,
		);
	}

	throw new NodeOperationError(
		ctx.getNode(),
		`Channel "${raw}" is ambiguous — it matches ${matches.length} channels: ${describeChannels(
			matches,
		)}. Use the channel UUID instead.`,
	);
}

/**
 * Resolve a list of channel references to UUIDs, fetching the channel list at
 * most once (only when at least one value is not already a UUID).
 */
async function resolveChannelRefs(
	ctx: IExecuteSingleFunctions,
	refs: string[],
): Promise<Map<string, string>> {
	const resolved = new Map<string, string>();
	const needsLookup = refs.some((r) => !UUID_RE.test(r.trim()));
	const channels = needsLookup ? await fetchChannels(ctx) : [];
	for (const ref of refs) {
		resolved.set(ref, resolveOne(ctx, ref, channels));
	}
	return resolved;
}

/**
 * preSend for Post → Create. Assembles the full request body: resolves each
 * channel reference (UUID, platform, handle, or display name) to a UUID, builds
 * one variant per selected channel (applying per-channel body overrides), splits
 * tags, computes the status default, and always stamps source: "n8n".
 */
export async function buildCreateBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const body = this.getNodeParameter('body') as string;
	const channelIds = this.getNodeParameter('channelIds', []) as string[];
	const status = this.getNodeParameter('status', 'draft') as string;
	const scheduledAt = this.getNodeParameter('scheduledAt', '') as string;
	const tagsRaw = this.getNodeParameter('tags', '') as string;
	const label = this.getNodeParameter('label', '') as string;
	const additional = this.getNodeParameter('additionalFields', {}) as CreateAdditionalFields;

	const overrideEntries = (additional.variants?.variant ?? []).filter((v) => v.channelId);

	// Resolve every channel reference (from channelIds and variant overrides) in
	// one pass so the channel list is fetched at most once.
	const allRefs = [...channelIds, ...overrideEntries.map((v) => v.channelId)];
	const resolved = await resolveChannelRefs(this, allRefs);

	const overrides = new Map<string, string>();
	for (const v of overrideEntries) {
		overrides.set(resolved.get(v.channelId) as string, v.body);
	}

	const variants = channelIds.map((ref) => {
		const channelId = resolved.get(ref) as string;
		return {
			channel_id: channelId,
			body: overrides.get(channelId) ?? body,
		};
	});

	// Default: "scheduled" when a time is set and the user left the default "draft".
	const finalStatus = scheduledAt && status === 'draft' ? 'scheduled' : status;

	const payload: IDataObject = {
		body,
		status: finalStatus,
		source: 'n8n',
		variants,
	};
	if (label) payload.label = label;
	if (scheduledAt) payload.scheduled_at = scheduledAt;
	if (additional.timezone) payload.timezone = additional.timezone;
	const tags = splitTags(tagsRaw);
	if (tags.length > 0) payload.tags = tags;

	requestOptions.body = payload;
	return requestOptions;
}

interface UpdateFields {
	body?: string;
	label?: string;
	scheduledAt?: string;
	tags?: string;
}

/** preSend for Post → Update. Sends only the fields the user filled in. */
export async function buildUpdateBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const fields = this.getNodeParameter('updateFields', {}) as UpdateFields;

	const payload: IDataObject = {};
	if (fields.body !== undefined && fields.body !== '') payload.body = fields.body;
	if (fields.label !== undefined && fields.label !== '') payload.label = fields.label;
	if (fields.scheduledAt) payload.scheduled_at = fields.scheduledAt;
	if (fields.tags) payload.tags = splitTags(fields.tags);

	requestOptions.body = payload;
	return requestOptions;
}
