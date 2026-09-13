import type { INodeProperties } from 'n8n-workflow';

const showOnlyForPostGetMany = {
	operation: ['getAll'],
	resource: ['post'],
};

export const postGetManyDescription: INodeProperties[] = [
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1 },
		displayOptions: { show: showOnlyForPostGetMany },
		routing: {
			send: { type: 'query', property: 'limit' },
			output: { maxResults: '={{$value}}' },
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: showOnlyForPostGetMany },
		options: [
			{
				displayName: 'Week',
				name: 'week',
				type: 'string',
				default: '',
				placeholder: '2026-09-14',
				description: 'Filter to a week, given as a date (YYYY-MM-DD) within it',
				routing: {
					send: { type: 'query', property: 'week' },
				},
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'scheduled',
				options: [
					{ name: 'Draft', value: 'draft' },
					{ name: 'Scheduled', value: 'scheduled' },
					{ name: 'Needs Approval', value: 'needs_approval' },
				],
				routing: {
					send: { type: 'query', property: 'status' },
				},
			},
			{
				displayName: 'Channel Name or ID',
				name: 'channelId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getChannels' },
				default: '',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				routing: {
					send: { type: 'query', property: 'channel_id' },
				},
			},
		],
	},
];
