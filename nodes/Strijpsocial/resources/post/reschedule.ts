import type { INodeProperties } from 'n8n-workflow';

const showOnlyForPostReschedule = {
	operation: ['reschedule'],
	resource: ['post'],
};

export const postRescheduleDescription: INodeProperties[] = [
	{
		displayName: 'Post ID',
		name: 'postId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: showOnlyForPostReschedule },
		description: 'The ID of the post to reschedule',
	},
	{
		displayName: 'Scheduled At',
		name: 'scheduledAt',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: { show: showOnlyForPostReschedule },
		description:
			'The new publish time. Interpreted in your StrijpSocial workspace timezone unless an offset is included.',
		routing: {
			send: { type: 'body', property: 'scheduled_at' },
		},
	},
];
