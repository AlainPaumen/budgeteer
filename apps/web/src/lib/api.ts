import { edenTreaty } from '@my-app/api-types';
import type { App } from '@my-app/api-types';

export const eden = edenTreaty<App>('http://localhost:3000');
