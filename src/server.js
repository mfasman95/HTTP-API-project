const http = require('http');
const { URL } = require('url');
const path = require('path');
const child_process = require('child_process'); // eslint-disable-line

const PORT = process.env.PORT || process.env.NODE_PORT || 3001;

const contentResponses = require('./contentResponses');
const jsonResponses = require('./jsonResponses');
const { handleApiGet, handleApiPost } = require('./apiHandler');

const handleContent = (req, res, urlData) => {
  let filePath;
  if (urlData.endPoint !== '') filePath = urlData.pathname.replace('/static', `./../client/build/${urlData.endPoint}`);
  else filePath = urlData.pathname.replace('/', './../client/build/');

  let fileName = urlData.pathParts[urlData.pathParts.length - 1];
  if (fileName === '') {
    fileName = 'index.html';
    filePath = `${filePath}/${fileName}`;
  }
  const fileExtension = fileName.substr(fileName.lastIndexOf('.') + 1);
  let contentType = 'text/html';
  switch (fileExtension) {
    case 'html': { contentType = 'text/html'; break; }
    case 'css': { contentType = 'text/css'; break; }
    case 'js': { contentType = 'application/javascript'; break; }
    case 'ico': { contentType = 'image/x-icon'; break; }
    case 'svg': { contentType = 'image/svg+xml'; break; }
    case 'map': { contentType = 'application/json'; break; }
    // Throw an internal server error if the file extension is not recognized
    default: { return jsonResponses.internalError(req, res); }
  }
  return contentResponses(path.join(__dirname, filePath))({ 'Content-Type': contentType })(req, res);
};

const reqHandlers = Object.freeze({
  GET: (req, res, urlData) => {
    switch (urlData.endPoint) {
      case '': { return handleContent(req, res, urlData); }
      case 'static': { return handleContent(req, res, urlData); }
      case 'api': { return handleApiGet(req, res, urlData.pathParts[1], urlData.searchParams); }
      default: { return jsonResponses.notFound(req, res); }
    }
  },
  POST: (req, res, urlData) => {
    // Only handle request if it was sent to the api endpoint
    if (urlData.endPoint === 'api') return handleApiPost(req, res, urlData.pathParts[1], urlData.searchParams);
    return jsonResponses.badReq('This is not a valid api endpoint', 'invalidEndpoint')(req, res);
  },
});

const onRequest = (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}/`);
  const { searchParams, pathname } = url;
  const pathParts = pathname.split('/');
  pathParts.splice(0, 1); // remove the unneeded first part which will always be ''

  // There is no endpoint if there is only one path part
  let endPoint;
  if (pathParts.length === 1) endPoint = '';
  else endPoint = pathParts[0];

  // Take all the parsed data and put it into an object to be sent to the appropriate handler
  const urlData = { searchParams, pathname, pathParts, endPoint };
  // Check if the API handles this kind of method
  if (reqHandlers[req.method]) return reqHandlers[req.method](req, res, urlData);
  // If the handler for the method is not implemented
  return jsonResponses.notImplemented(req, res);
};

const startServer = () => http.createServer(onRequest).listen(PORT, () => { console.dir(`Server listening at localhost:${PORT}`); });

console.log(process.env.NODE_ENV);
// In production, build the client app before starting the server
if (process.env.NODE_ENV === 'production') {
  // Install the necessary dependencies
  child_process.spawnSync('yarn', [''], { stdio: 'inherit', cwd: 'client', shell: true });
  // Build the react application
  child_process.spawnSync('npm run', ['build'], { stdio: 'inherit', cwd: 'client', shell: true });

  // Start the server after building the application
  startServer();
// Outside of production, the client app is being hotloaded so it doesn't need a build
} else startServer();
