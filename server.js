require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 4000;
const IP_ADDR = process.env.IP_ADDR || 'localhost';

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access on local network: ${IP_ADDR}:${PORT}`);
});
