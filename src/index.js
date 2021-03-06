const fs = require('fs');
const { join } = require('path');

module.exports = class Xeno {

    /**
     * Xeno framework constructor
     * @param {Object} opts Bot settings
     */
    constructor(opts = {}) {

        if (typeof opts !== "object") throw new Error("Non-Object provided as parameters");

        if (!opts.paths) opts.paths = {};

        this.paths = {

            base: opts.paths.base || '',
            commands: opts.paths.commands || 'commands',
            events: opts.paths.events || 'events',
            services: opts.paths.services || 'services',

        }

        this.services = opts.services || 'services';

        if (!opts.client) throw new Error("No Client provided");
        this.client = opts.client;

        this._setup_modules();

    }

    /**
     * Internal function to register commands, events and services
     */
    _setup_modules = () => {

        this.absolute_paths = {

            commands: join(this.paths.base, this.paths.commands),
            events: join(this.paths.base, this.paths.events),
            services: join(this.paths.base, this.paths.services),

        }

        Object.keys(this.absolute_paths).forEach(folder => {

            if (!fs.existsSync(this.absolute_paths[folder])) throw new Error(`Location does not exist '${this.absolute_paths[folder]}'`);

        })

        // Commands
        this.alias = {}, this.commands = {}, this.command_list = {};
        fs.readdirSync(this.absolute_paths.commands)
            .filter(file => file.match(/\.js$/))
            .forEach(file => {

                let command = require(join(this.absolute_paths.commands, file));

                if (!command.run) throw new Error(`No 'run' function found in command '${file}'`);
                if (!command.description || !command.example || !command.usage || !command.group) console.warn(`Command '${file}' is missing some meta properties (description, example, usage or group)`);

                if (command.alias) this.alias[file.slice(0, -3)] = command.alias;
                this.commands[file.slice(0, -3)] = command.run;

                let group = command.group || 'Unsorted';
                if (!this.command_list[group]) this.command_list[group] = [];

                this.command_list[group].push({
                    name: file.slice(0, -3),
                    description: command.description || 'No description provided',
                    usage: command.usage || 'No usage provided',
                    example: command.example || 'No example provided',
                    alias: command.alias || [],
                })

            });

        // Events
        fs.readdirSync(this.absolute_paths.events)
            .filter(file => file.match(/\.js$/))
            .forEach(file => {

                let event = require(join(this.absolute_paths.events, file));

                if (!event.run) throw new Error(`No 'run' function found in event '${file}'`);
                this.client.on(file.slice(0, -3), (...args) => { args.push(this); event.run(...args); });

            });

        // Services
        this.client[this.services] = {};
        fs.readdirSync(this.absolute_paths.services)
            .filter(file => file.match(/\.js$/))
            .forEach(file => {

                this.client[this.services][file.slice(0, -3)] = require(join(this.absolute_paths.services, file));

            })

    }

    /**
     * Run a command from the commands folder
     * @param {String} prefix The bot's prefix
     * @param {String} string The incoming message content
     * @param {Object} message Message object which is passed to commands
     * @returns {Boolean} Whether or not a command was exectuted
     */
    run_command = (prefix, string, message) => {

        if(!string.startsWith(prefix)) return;

        const args = string.trim().slice(prefix.length).split(/ +/g);
        let command = args.shift().toLowerCase();

        if (!this.commands[command]) {

            let run = Object.keys(this.alias).find(cmd => this.alias[cmd].indexOf(command) > -1);
            if (run) this.commands[run](args, message, this);
            return false;

        } else {

            this.commands[command](args, message, this);
            return true;

        }
        
    }

    /**
     * Returns the command object or null if not found
     * @param {String} name Name or alias of command
     * @returns {Object|null}
     */
    get_command_by_name = name => {

        for(let section of Object.keys(this.command_list)) {

            for(let command of this.command_list[section]) {

                if(command.name == name || command.alias.indexOf(name) > -1) return command;

            }

        }

    }

}
