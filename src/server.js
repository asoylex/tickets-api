require('dotenv').config();

const app = require('./app');

const {sequelize} = require('./models');

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

start();