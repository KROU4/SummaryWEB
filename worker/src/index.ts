import { handleTranscriptRequest } from './transcript';

export default {
  fetch(request: Request, env: { ALLOWED_ORIGIN?: string }) {
    return handleTranscriptRequest(request, env);
  },
};
