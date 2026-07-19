const http = require('http');

const port = process.env.PORT || 3001;

const requestListener = (request, response) => {
  if (request.url === '/api/health') {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(
      JSON.stringify({
        status: 'ok',
        service: 'picpals-horses-backend'
      })
    );
    return;
  }

  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(
    JSON.stringify({
      message: 'PicPals Horses backend is running.'
    })
  );
};

const server = http.createServer(requestListener);

server.listen(port, () => {
  console.log(`PicPals Horses backend listening on port ${port}`);
});
