// Load environment variables from .env file for tests
require('dotenv').config();

// Set test mode
process.env.IN_TEST_MODE = 'true';