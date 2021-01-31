
// Config
const { token } = require('./config.json');

// Instantiate Client
const Client = new (require('discord.js').Client)();

// Setup framework
const Xeno = new (require('../src/index'))({
    client: Client,
    paths: {
        base: `${__dirname}/modules`
    }
});

// Login Client
Client.login(token);