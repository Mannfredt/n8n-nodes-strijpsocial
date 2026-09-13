import type { INodeProperties } from 'n8n-workflow';

const showOnlyForPostUpdate = {
	operation: ['update'],
	resource: ['post'],
};

export const postUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Post ID',
		name: 'postId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: showOnlyForPostUpdate },
		description: 'The ID of the post to update',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showOnlyForPostUpdate },
		options: [
			{
				displayName: 'Body',
				name: 'body',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
				description: 'The post text',
			},
			{
				displayName: 'Label',
				name: 'label',
				type: 'string',
				default: '',
				description: 'Internal name / YouTube title for the post',
			},
			{
				displayName: 'Scheduled At',
				name: 'scheduledAt',
				type: 'dateTime',
				default: '',
				description:
					'When to publish the post. Interpreted in your StrijpSocial workspace timezone unless an offset is included.',
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				default: '',
				placeholder: '#launch, #product',
				description: 'Comma-separated hashtags. Split into an array before sending.',
			},
		],
	},
];
