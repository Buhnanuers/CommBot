const { channel } = require("diagnostics_channel");
const Discord = require("discord.io");
const logger = require("winston");
const auth = require("./auth.json");
const db = require("quick.db");
const { Message } = require("discord.js");

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console(), {
  colorize: true,
});
logger.level = "debug";

// Initialize Discord bot
let bot = new Discord.Client({
  token: auth.token,
  autorun: true,
});

// Boolean flag to keep track of nested commands
let in_progress = false;

bot.on("ready", function (evt) {
  logger.info("Connected");
});
bot.on("message", function (user, userID, channelID, message, evt) {
  // Get ID of guild (server) the message was sent from
  let serverID = bot.channels[channelID].guild_id;

  // Our bot needs to know if it will execute a command
  // It will listen for messages that start with '!'
  if (message.substring(0, 1) == "!") {
    let args = message.substring(1).split(" ");
    let cmd = args[0];

    args = args.splice(1);
    switch (cmd) {
      // Display help commands
      case "CBtreat": {
        bot.sendMessage({
          to: channelID,
          message: "Yum! Thank you so much for the treat!"
        });
        break;
      }

      case "CBhelp": {
        if (args.length === 0) {
          bot.sendMessage({
            to: channelID,
            message:
              "List of commands: " +
              "```!CBhelp CBcommadd (help with formatting the command)\n" +
              "!CBhelp CBtype (list common types of commissions)\n" +
              "!CBhelp CBremovenext (help with formatting the command)\n" +
              "!CBhelp CBremove (help with fomatting the command)\n" +
              "!CBhelp CBedit (help with formatting the command)\n" +
              "```",
          });
        }

        switch (args[0]) {
          case "CBcommadd": {
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

          case "CBtype": {
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

            break;
          }

          case "CBedit": {
            bot.sendMessage({
              to: channelID,
              message:
                "This command allows you to edit an existing commission! Simply enter '!CBedit w x y z', " +
                "where 'w' is the index of the commission you wish to change,\n" +
                "x is the Twitch username of the commissioner,\n" +
                "y is the amount paid,\n" +
                "and z is the type of commission purchased.\n" +
                "For example, to edit the first commission:" +
                "```!CBedit 1 CoolTwitchUser $100 Colored/Full-body```",
            });

            break;
          }

          case "CBremovenext": {
            bot.sendMessage({
              to: channelID,
              message: "This command removes the next commission in the queue.",
            });

            break;
          }

          case "CBremove": {
            bot.sendMessage({
              to: channelID,
              message:
                "This command removes a specific commission from the queue, provided it exists.\n" +
                "This command supports a single extra argument, either of the form of a username, or a specific index in the queue.\n" +
                "For example:```!CBremove CoolTwitchUser\n```or```!CBremove 2```",
            });
          }
        }

        break;
      }

      // Display the commissions queue
      case "CBqueue": {
        const queue = db.get(`comm_${serverID}`);

        let message = displayQueue(queue);

        bot.sendMessage({
          to: channelID,
          message: `Current queue: ${message}`,
        });

        break;
      }

      // Add a new commission object to the commissions queue
      case "CBcommadd": {
        // Perform input validation
        if (args.length < 3) {
          bot.sendMessage({
            to: channelID,
            message: `Formatting error, too few arguments! Use "!CBhelp CBcommadd" for help with formatting!`,
          });
          break;
        } else if (args.length > 3) {
          bot.sendMessage({
            to: channelID,
            message: `Formatting error, too many arguments! Use "!CBhelp CBcommadd" for help with formatting!`,
          });
          break;
        }

        // Initialize a new comm object
        let newComm = {
          username: args[0],
          amount: args[1],
          type: args[2],
        };

        // Push this new comm object into the corresponding server's database table
        db.push(`comm_${serverID}`, newComm);

        // Display in discord a confirmation message to the user
        bot.sendMessage({
          to: channelID,
          message: `${user}, your commission has been added to the queue! Use '!CBqueue' to check your position!`,
        });

        break;
      }

      // Edit an existing commission
      case "CBedit": {
        const queue = db.get(`comm_${serverID}`);

        // Error checking
        if (args.length < 4) {
          bot.sendMessage({
            to: channelID,
            message: `Formatting error, too few arguments! Use "!CBhelp CBedit" for help with formatting!`,
          });
          break;
        }

        // Error checking
        if (args.length > 4) {
          bot.sendMessage({
            to: channelID,
            message: `Formatting error, too many arguments! Use "!CBhelp CBedit" for help with formatting!`,
          });
          break;
        }

        // Error checking
        if (isNaN(args[0])) {
          bot.sendMessage({
            to: channelID,
            message: `Formatting error, argument is not a number! Use "!CBhelp CBedit" for help with formatting!`,
          });
          break;
        }

        // First, check if the element to change exists
        if (args[0] - 1 > queue.length) {
          bot.sendMessage({
            to: channelID,
            message: `Error, ${args[0]} does not exist in the queue!`,
          });
          break;
        } else {
          console.log(queue + "\n" + queue[args[0] - 1] + "\n" + args[1]);

          // If it exists, implement the users' changes
          queue[args[0] - 1].username = args[1].toString();
          queue[args[0] - 1].amount = args[2].toString();
          queue[args[0] - 1].type = args[3].toString();

          // Update the database table with the new queue
          db.set(`comm_${serverID}`, queue);

          // Report back a successful edit
          bot.sendMessage({
            to: channelID,
            message: `The entry at index ${args[0]} has been successfully changed!`,
          });

          break;
        }
      }

      // Remove next element from the queue
      case "CBremovenext": {
        const queue = db.get(`comm_${serverID}`);

        // Error checking
        if (args.length > 1) {
          bot.sendMessage({
            to: channelID,
            message: `Formatting error, too many arguments! Use "!CBhelp CBremovenext" for help with formatting!`,
          });
          break;
        }

        // Error checking
        if (!queue) {
          bot.sendMessage({
            to: channelID,
            message: `The queue is empty, nothing to remove!`,
          });

          break;
        }

        // Splice the first element out of the queue array
        queue.splice(0, 1);

        // Update the database table with the new queue
        db.set(`comm_${serverID}`, queue);

        // Report back a successful removal
        bot.sendMessage({
          to: channelID,
          message: `Commission has been removed from the front of the queue!`,
        });

        break;
      }

      // Remove specific element from the queue
      case "CBremove": {
        let queue = db.get(`comm_${serverID}`);

        // Error checking
        if (args.length < 1) {
          bot.sendMessage({
            to: channelID,
            message: `Formatting error, too few arguments! Use "!CBhelp CBremove" for help with formatting!`,
          });
          break;
        } else if (args.length > 1) {
          bot.sendMessage({
            to: channelID,
            message: `Formatting error, too many arguments! Use "!CBhelp CBremove" for help with formatting!`,
          });
          break;
        }

        // Error Checking
        if (!queue) {
          bot.sendMessage({
            to: channelID,
            message: `The queue is empty, nothing to remove!`,
          });

          break;
        }

        // This supports having the second argument be either a number in the array, or a name
        // Check if the second argument is a number or not
        if (isNaN(args[0])) {
          // Double check to ensure that this argument is a string (it should be)
          if (typeof args[0] === "string" || args[0] instanceof String) {
            // Find the element in the commissions array, and remove it
            for (var i = 0; i < queue.length; i++) {
              if (queue[i].username === args[0]) {
                bot.sendMessage({
                  to: channelID,
                  message: `${queue[i].username}'s commission has been removed from the queue!`,
                });
                // Splice the element out of the queue array
                queue.splice(i, 1);

                // Update the database table with the new queue
                db.set(`comm_${serverID}`, queue);

                break;
              }
            }

            break;
          }
        } else {
          // Here, the second argument is a number, so the process of removing the corresponding element from the array
          // is much more simple
          // First, ensure that trying this doesn't result in an array out-of-bounds error
          if (args[0] > queue.length) {
            bot.sendMessage({
              to: channelID,
              message: `${args[0]} is a number larger than the length of the queue, so nothing happened!`,
            });
          } else {
            bot.sendMessage({
              to: channelID,
              message: `${
                queue[args[0] - 1].username
              }'s commission has been removed from the queue!`,
            });
            // Splice the element out of the queue array
            queue.splice(args[0] - 1, 1);

            // Update the database table with the new queue
            db.set(`comm_${serverID}`, queue);

            break;
          }
        }
      }
    }
  }
});

// Function to display contents of commission queue
const displayQueue = (queue) => {
  let count = 1;
  console.log(queue);
  // The queue should be displayed as a list
  // formatted into a discord code block
  // which begins and ends with triple tilde "```"
  if (queue.length === 0) {
    let message = "Queue is empty!";
    return message;
  } else {
    let message = "```";

    for (const it in queue) {
      message +=
        `${count}. ` +
        queue[it].username +
        ", " +
        queue[it].amount +
        ", " +
        queue[it].type +
        "\n";

      count++;
    }

    return (message += "```");
  }
};
