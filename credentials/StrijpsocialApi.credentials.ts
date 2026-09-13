import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class StrijpsocialApi implements ICredentialType {
	name = 'strijpsocialApi';

	displayName = 'StrijpSocial API';

	documentationUrl = 'https://strijpsocial.com/docs';

	icon: Icon = {
		light: 'file:../nodes/Strijpsocial/strijpsocial.svg',
		dark: 'file:../nodes/Strijpsocial/strijpsocial.dark.svg',
	};

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			placeholder: 'ssk_live_...',
			description: 'Your StrijpSocial API key from Settings → API keys',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://strijpsocial.com/api',
			description: 'API base URL. Change only if self-hosting.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	// A 200 from GET /channels means the key works.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/channels',
			method: 'GET',
		},
	};
}
