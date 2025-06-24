const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const { v4: uuidv4 } = require('uuid');

server.use(middlewares);
server.use(jsonServer.bodyParser);

// ✅ Public routes allowed BEFORE auth middleware
const isPublicRoute = (req) => {
  const publicRoutes = [
    { method: 'POST', path: '/users' },
    { method: 'POST', path: '/sessions' },
    { method: 'GET', path: '/books' },
    { method: 'GET', path: '/publishers' }
  ];

  return publicRoutes.some(
    route => route.method === req.method && req.path.startsWith(route.path)
  );
};

// 🔐 Auth middleware (ONLY applied after public routes)
server.use((req, res, next) => {
  if (isPublicRoute(req)) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Token missing' });
  }

  const token = authHeader.split(' ')[1];
  const session = router.db.get('sessions').find({ token }).value();
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  next();
});

// ✅ POST /sessions → Simulate login
server.post('/sessions', (req, res) => {
  const { userId } = req.body;
  const token = uuidv4();
  const session = { id: uuidv4(), userId, token };
  router.db.get('sessions').push(session).write();
  res.status(201).json(session);
});

server.use(router);
server.listen(3000, () => {
  console.log('✅ JSON Server running at http://localhost:3000');
});
