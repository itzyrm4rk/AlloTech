import { auth, toNextJsHandler } from '@allotech/auth';

export const { GET, POST } = toNextJsHandler(auth);
