export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (url.pathname === '/api/hello') {
        return new Response(JSON.stringify({ message: 'Hello from the API!' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response('Not found', { status: 404 });
    }
    return env.ASSETS.fetch(request);
  }
};
