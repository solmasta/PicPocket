import { handleApi } from './backend/src/server.js';

export default {
  async fetch(request, env) {
    // Add D1 database and R2 bucket to env object
    const enhancedEnv = {
      ...env,
      DB: env.DB, // D1 database binding
      BUCKET: env.BUCKET, // R2 bucket binding
      AI: env.AI // Workers AI binding
    };
    
    return handleApi(request, enhancedEnv);
  }
};