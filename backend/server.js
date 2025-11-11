const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Load env vars
dotenv.config();

// Connect to database
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://Chirag:chirag123@cluster0.ltuot3p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
console.log('Using MongoDB URI:', mongoURI ? 'Found' : 'Not found');
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB connection error:', err));

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Serve static files
app.use('/uploads', express.static('uploads'));

// Swagger setup
const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'SMART SIT API',
    version: '1.0.0',
    description: 'API documentation for SMART SIT',
  },
  servers: [
    { url: `${process.env.BACKEND_PUBLIC_URL || 'http://localhost:' + (process.env.PORT || 5000)}/api` },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const swaggerOptions = {
  definition: swaggerDefinition,
  // You can add JSDoc comments in route/controller files to enrich docs later
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/student', require('./routes/student'));
app.use('/api/parents', require('./routes/parents'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
const marksRoutes = require('./routes/marks');
app.use('/api/marks', marksRoutes);
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/internal-marks', require('./routes/internalMarks'));
app.use('/api/2fa', require('./routes/twoFactor'));
// app.use('/api/integrations', require('./routes/integrations'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SMART SIT API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
