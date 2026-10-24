require('dotenv').config();


const base ={

    username: process.env.DB_USER || 'tickets',
    password: process.env.DB_PASSWORD || 'change_me',
    database: process.env.DB_NAME || 'tickets_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    dialect: 'postgres',
    define: {
        timestamps: true,
        underscored: true,
    }
}

module.exports = {
    development: {...base, logging: console.log},
    test: {...base, logging: false},
    production: {...base, logging: false},
}