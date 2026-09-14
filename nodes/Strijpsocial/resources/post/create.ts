import type { INodeProperties } from 'n8n-workflow';

const showOnlyForPostCreate = {
	operation: ['create'],
	resource: ['post'],
};

export const postCreateDescription: INodeProperties[] = [
	{
		displayName: 'Body',
		name: 'body',
		type: 'string',
		typeOptions: { rows: 4 },
		required: true,
		default: '',
		displayOptions: { show: showOnlyForPostCreate },
		description: 'The post text. Used as the default body for every selected channel.',
	},
	{
		displayName: 'Channels',
		name: 'channels',
		type: 'string',
		default: '',
		placeholder: 'bluesky, linkedin',
		displayOptions: { show: showOnlyForPostCreate },
		description:
			'Comma-separated channel names, platforms, or IDs, e.g. "bluesky, linkedin". Each is resolved to a channel UUID automatically. Leave empty to use the "Channel Names or IDs" picker below instead. When you do not know the channels, run the Channel: Get Many operation first to discover them.',
	},
	{
		displayName: 'Channel Names or IDs',
		name: 'channelIds',
		type: 'multiOptions',
		default: [],
		typeOptions: {
			loadOptionsMethod: 'getChannels',
		},
		displayOptions: { show: showOnlyForPostCreate },
		description:
			'The channels to publish to. Each value is a channel UUID; a platform name (e.g. "bluesky"), a handle (e.g. "@myhandle"), or a display name is also accepted and resolved to the UUID automatically. Ignored if "Channels" is set. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Scheduled At',
		name: 'scheduledAt',
		type: 'dateTime',
		default: '',
		displayOptions: { show: showOnlyForPostCreate },
		description:
			'When to publish. Leave empty to keep the post as a draft. Interpreted in your StrijpSocial workspace timezone unless an offset is included.',
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		default: 'draft',
		options: [
			{ name: 'Draft', value: 'draft' },
			{ name: 'Scheduled', value: 'scheduled' },
			{ name: 'Needs Approval', value: 'needs_approval' },
		],
		displayOptions: { show: showOnlyForPostCreate },
		description:
			'Post status. Left as Draft with a Scheduled At time set, it is sent as Scheduled.',
	},
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		default: '',
		placeholder: '#launch, #product',
		displayOptions: { show: showOnlyForPostCreate },
		description: 'Comma-separated hashtags. Split into an array before sending.',
	},
	{
		displayName: 'Label',
		name: 'label',
		type: 'string',
		default: '',
		displayOptions: { show: showOnlyForPostCreate },
		description: 'Internal name / YouTube title for the post',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showOnlyForPostCreate },
		options: [
			{
				displayName: 'Timezone',
				name: 'timezone',
				type: 'string',
				default: '',
				placeholder: 'Europe/Amsterdam',
				description: 'IANA timezone used to interpret the scheduled time',
			},
			{
				displayName: 'Per-Channel Variants',
				name: 'variants',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				description: 'Override the body for specific channels',
				options: [
					{
						name: 'variant',
						displayName: 'Variant',
						values: [
							{
								displayName: 'Channel Name or ID',
								name: 'channelId',
								type: 'options',
								typeOptions: { loadOptionsMethod: 'getChannels' },
								default: '',
								description:
									'Channel this override applies to. Accepts a UUID, platform name, handle, or display name. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
							},
							{
								displayName: 'Body',
								name: 'body',
								type: 'string',
								typeOptions: { rows: 3 },
								default: '',
								description: 'Body text to use for this channel instead of the default',
							},
						],
					},
				],
			},
		],
	},
];
