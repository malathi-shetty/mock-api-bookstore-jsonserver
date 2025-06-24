const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const { v4: uuidv4 } = require('uuid');

server.use(middlewares);
server.use(jsonServer.bodyParser);

server.post('/sessions', (req, res) => {
  const { userId } = req.body;
  const token = uuidv4();
  const session = { id: uuidv4(), userId, token };
  router.db.get('sessions').push(session).write();
  res.status(201).json(session);
});

server.use((req, res, next) => {
  const publicPaths = ['/books', '/publishers', '/users', '/sessions'];
  const isPublic = publicPaths.some(path => req.path.startsWith(path));
  if (isPublic && req.method === 'GET') return next();

  const token = req.headers.authorization?.split(' ')[1];
  const validSession = router.db.get('sessions').find({ token }).value();
  if (validSession) return next();

  return res.status(401).json({ error: 'Unauthorized' });
});

server.use(router);
server.listen(3000, () => {
  console.log('🚀 JSON Server running at http://localhost:3000');
});