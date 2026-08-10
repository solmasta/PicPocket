import { handleApi } from './backend/src/server.js';

export default {
  async fetch(request, env) {
    // Add D1 database to env object
    const enhancedEnv = {
      ...env,
      DB: env.DB // D1 database binding
    };
    
    return handleApi(request, enhancedEnv);
  }
};