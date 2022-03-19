const Discord = require("discord.io");
const { ButtonInteraction } = require("discord.js");
const logger = require("winston");
const auth = require("./auth.json");

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console(), {
  colorize: true,
});
logger.level = "debug";

// Initialize data structure to hold commission queue
// Comission element arguments:
// 1. Twitch username of commissioner
// 2. Amount paid ($ will be added to amounts if not provided)
// 3. Type of commission ()
// Example: !commadd buhnaneurs $50 Emote
let commissions = [];

// Initialize Discord bot
let bot = new Discord.Client({
  token: auth.token,
  autorun: true,
});

bot.on("ready", function (evt) {
  logger.info("Connected");
  logger.info("Logged in as: ");
  logger.info(bot.username + " - (" + bot.id + ")");
});
bot.on("message", function (user, userID, channelID, message, evt) {
  // Our bot needs to know if it will execute a command
  // It will listen for messages that start with '!'
  if (message.substring(0, 1) == "!") {
    let args = message.substring(1).split(" ");
    let cmd = args[0];

    args = args.splice(1);
    switch (cmd) {
      // Display help commands
      case "help": {
        if (args.length === 0) {
          bot.sendMessage({
            to: channelID,
            message:
              "List of commands: " +
              "```commadd (help with formatting the command)\n" +
              "type (list common types of commissions)\n" +
              "```",
          });
        }

        switch (args[0]) {
          case "commadd": {
            bot.sendMessage({
              to: channelID,
              message:
                "To add a new commission to the queue, please supply your Twitch username, the amount you paid, and the type of commission you purchased!\n" +
                "An example command would look something like:" +
                "```!commadd CoolTwitchUser $100 sketch/full-body```" +
                "Please ensure that each argument is free of any whitespaces (Example, do not add a space between 'sketch' and 'full-body'). Add a '/' or '&' instead.",
            });
            break;
          }

          case "type": {
            bot.sendMessage({
              to: channelID,
              message:
                "List of common types of commissions:" +
                "```" +
                "Bust/Headshot\n" +
                "Hip-up/Halfbody\n" +
                "Full-Body\n" +
                "Emote\n\n" +
                "Sketch\n" +
                "Colored-Sketch\n" +
                "Line-Art\n" +
                "Colored\n" +
                "Rendered```" +
                "Type of framing and type of coloring can be of any combination, for example:" +
                "```Emote/Colored\nFull-Body/Line-Art\nHeadshot/Rendered```",
            });
          }
        }

        break;
      }

      // Display the commissions queue
      case "queue": {
        queue = displayQueue();
        bot.sendMessage({
          to: channelID,
          message: `Current queue: ${queue}`,
        });

        break;
      }

      // Add a new commission object to the commissions queue
      case "commadd": {
        // Perform input validation
        if (args.length < 3) {
          bot.sendMessage({
            to: channelID,
            message: `Formatting error, too few arguments! Use "!help commadd" for help with formatting!`,
          });
          break;
        } else if (args.length > 3) {
          bot.sendMessage({
            to: channelID,
            message: `Formatting error, too many arguments! Use "!help commadd" for help with formatting!`,
          });
          break;
        }

        // Initialize a new comm object
        let newComm = {
          username: args[0],
          amount: args[1],
          type: args[2],
        };

        // Push this new comm object into the commissions array
        commissions.push(newComm);

        // Display in discord a confirmation message to the user
        bot.sendMessage({
          to: channelID,
          message: `${user}, your commission has been added to the queue! Use '!queue' to check your position!`,
        });

        break;
      }
    }
  }
});

// Function to display contents of commission queue
const displayQueue = () => {
  let count = 0;
  // The queue should be displayed as a list
  // formatted into a discord code block
  // which begins and ends with triple tilde "```"
  if (commissions.length === 0) {
    let message = "Queue is empty!";
    return message;
  } else {
    let message = "```";

    for (const it in commissions) {
      message +=
        "1. " +
        commissions[it].username +
        ", " +
        commissions[it].amount +
        ", " +
        commissions[it].type +
        "\n";

      count++;
    }

    return (message += "```");
  }
};
