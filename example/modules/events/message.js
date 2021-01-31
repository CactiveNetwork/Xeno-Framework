const { prefix } = require('../../config.json');

exports.run = (Message, Xeno) => {

    // Avoid garbage lol
    if(Message.author.bot || !Message.member || !Message.guild) return;

    // Run the commands or smth
    Xeno.run_command(prefix, Message.content, Message);

}