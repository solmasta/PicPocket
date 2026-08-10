// Performance monitoring middleware for tracking response times and identifying bottlenecks

export async function performanceMonitor(request, env, ctx) {
  const startTime = Date.now();
  const requestMethod = request.method;
  const requestUrl = request.url;
  
  // Log request start
  console.log(`[PERFORMANCE] ${requestMethod} ${requestUrl} - Request started`);
  
  // Add performance tracking to context
  ctx.performance = {
    startTime,
    requestMethod,
    requestUrl,
    metrics: {}
  };
  
  // Continue with the request
  return new Response(null, { status: 200 });
}

export async function performanceLogger(request, response, ctx) {
  if (ctx.performance) {
    const endTime = Date.now();
    const duration = endTime - ctx.performance.startTime;
    
    // Log response time
    console.log(`[PERFORMANCE] ${ctx.performance.requestMethod} ${ctx.performance.requestUrl} - Completed in ${duration}ms`);
    
    // Track slow requests (over 1 second)
    if (duration > 1000) {
      console.warn(`[PERFORMANCE] Slow request detected: ${ctx.performance.requestMethod} ${ctx.performance.requestUrl} took ${duration}ms`);
    }
    
    // Add server timing header for detailed metrics
    const serverTiming = `app;dur=${duration}`;
    response.headers.set('Server-Timing', serverTiming);
  }
}