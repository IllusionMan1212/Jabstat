const config = module.require('./../utility/config.js');
const Discord = require('discord.js');
const functions = require('./../utility/contest');

module.exports.run = async(client, message, args, db) => {

  const cmd = args[0];

  let startdate, enddate;

  let currentDate = new Date();

  const formatDate = (rawDate) => {
    let date = new Date(rawDate);
    let dateStr = ('0' + (date.getMonth() + 1)).slice(-2) + '/' + ('0' + date.getDate()).slice(-2) + '/' + date.getFullYear() + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
    return {
      date: date,
      dateStr: dateStr
    }
  }


  // function delay() {
  //   return new Promise(resolve => setTimeout(resolve, 300));
  // }
  //
  // async function delayedLog(item) {
  //   await delay();
  // }
  //
  // async function processContests(array) {
  //   // for (const contest in array) {
  //   //
  //   //   await delayedLog(contest);
  //   // }
  //
  //   for (let i = 0; i < array.length; i++) {
  //
  //     await delayedLog(array[i]);
  //   }
  //   console.log('done!');
  // } // processContests






  // no arg => show current contest Or list if no current contests available
  if (!cmd) {

    let contest, participants = [], themes = [];

    db.execute(config, database => database.query(`SELECT * FROM contest WHERE NOW() BETWEEN startdate AND enddate`)
    .then(rows => {
      if (rows.length < 1) return message.channel.send(`There is currently no contest running.`);

      voteLink = rows[0].votelink;
      startdate = formatDate(rows[0].startdate);
      enddate = formatDate(rows[0].enddate);

      contest = rows[0];

      return database.query(`SELECT * FROM contestThemes WHERE contestId = '${contest.id}' ORDER BY startdate`);
    })
    .then(rows => {
      if (rows.length < 1) {
        themes.push('not set');
      } else {
        for (let i = 0; i < rows.length; i++) {
          let themeStart = formatDate(rows[i].startdate);
          let themeEnd = formatDate(rows[i].enddate);

          // if the startdate of the theme is in the future && its a hidden contest hide the theme
          if (themeStart.date > currentDate && contest.visibility == 'hidden') {
            themes.push('- ' + '\\*'.repeat(rows[i].name.length));
          } else if (themeEnd.date < currentDate) {
            // if the theme is already over => line through
            themes.push(`- ~~${rows[i].name}~~`);
          } else if (themeStart.date <= currentDate && themeEnd.date >= currentDate) {
            // if the theme is right now => bold & underlined
            themes.push(`- __**${rows[i].name}**__`);
          } else {
            themes.push(`- ${rows[i].name}`);
          }
        }
      }

      return database.query(`SELECT * FROM contestUsers WHERE contestID = '${contest.id}'`);
    })
    .then(rows => {

      function delay() {
        return new Promise(resolve => setTimeout(resolve, 300));
      }

      async function delayedLog(item) {
        await delay();
      }

      async function processUsers(array) {

        for (let i = 0; i < array.length; i++) {
          let participantId = array[i].userID;
          let participantSubmissionLink = array[i].submissionLink;
          db.execute(config, database => database.query(`SELECT * FROM jabusers WHERE id = '${participantId}'`)
          .then(rows => {
            participants[rows[0].username] = participantSubmissionLink;
          }))
          .catch(err => {
            throw err;
          });

          await delayedLog(array[i]);
        }

        let contestTypeStr = '';

        if (themes.length > 1) {
          contestTypeStr = `\n\n*This is a ${contest.type} contest*`;
        }
        let voteLinkStr = '';
        if (voteLink) voteLinkStr = `\n\n[Vote link](${voteLink})`;

        // contest detail embed
        let embed = new Discord.RichEmbed()
        .setAuthor('Contest!', (contest.visibility == 'hidden') ? 'https://ice-creme.de/images/jabstat/hidden-icon.jpg' : 'https://ice-creme.de/images/jabstat/public-icon.jpg')
        .setTitle(contest.name)
        .setDescription(`${contest.description}${contestTypeStr}\n\nadd \`>contest submit ${contest.id}\` to your submission\n\nVoting will start after the deadline.${voteLinkStr}\n\n*Date: MM.DD.YYYY UTC*`)
        .setColor((contest.visibility == 'hidden') ? '#e74c3c' : '#3498db')
        .addBlankField()
        .addField('Start', startdate.dateStr, true)
        .addField('Deadline', enddate.dateStr, true)
        .addField('Themes:', `${themes.join('\n')}`)
        .setFooter(`beep boop • contest ID: ${contest.id}`, client.user.avatarURL);

        let participantString = [];

        for (let key in participants) {
          if (participants.hasOwnProperty(key)) {
            participantString.push(`[${key}](${participants[key]})`);
          }
        }

        // contest submission list
        let participantEmbed = new Discord.RichEmbed()
        .setDescription('click on the names to see the submission')
        .setColor((contest.visibility == 'hidden') ? '#e74c3c' : '#3498db')
        .addField('Submissions:', `- ${participantString.join('\n- ')}`)
        .setFooter(`beep boop`, client.user.avatarURL);

        message.channel.send({embed: embed}).then(() => {
          message.channel.send({embed: participantEmbed});
        });

      } // processContests

      processUsers(rows);

      // return;
    }))
    .catch(err => {
      throw err;
    });



  // contest ID => show contest details
  } else if (/^\d+$/.test(cmd)) {


    let contest, participants = [], themes = [];

    db.execute(config, database => database.query(`SELECT * FROM contest WHERE id = '${cmd}'`)
    .then(rows => {
      if (rows.length < 1) return message.channel.send(`There is no contest with the id \`${cmd}\`.`);

      voteLink = rows[0].votelink;
      startdate = formatDate(rows[0].startdate);
      enddate = formatDate(rows[0].enddate);

      contest = rows[0];

      return database.query(`SELECT * FROM contestThemes WHERE contestId = '${contest.id}' ORDER BY startdate`);
    })
    .then(rows => {
      if (rows.length < 1) {
        themes.push('not set');
      } else {
        for (let i = 0; i < rows.length; i++) {
          let themeStart = formatDate(rows[i].startdate);
          let themeEnd = formatDate(rows[i].enddate);

          // if the startdate of the theme is in the future && its a hidden contest hide the theme
          if (themeStart.date > currentDate && contest.visibility == 'hidden') {
            themes.push('- ' + '\\*'.repeat(rows[i].name.length));
          } else if (themeEnd.date < currentDate) {
            // if the theme is already over => line through
            themes.push(`- ~~${rows[i].name}~~`);
          } else if (themeStart.date <= currentDate && themeEnd.date >= currentDate) {
            // if the theme is right now => bold & underlined
            themes.push(`- __**${rows[i].name}**__`);
          } else {
            themes.push(`- ${rows[i].name}`);
          }
        }
      }

      return database.query(`SELECT * FROM contestUsers WHERE contestID = '${contest.id}'`);
    })
    .then(rows => {

      function delay() {
        return new Promise(resolve => setTimeout(resolve, 300));
      }

      async function delayedLog(item) {
        await delay();
      }

      async function processUsers(array) {

        for (let i = 0; i < array.length; i++) {
          let participantId = array[i].userID;
          let participantSubmissionLink = array[i].submissionLink;
          db.execute(config, database => database.query(`SELECT * FROM jabusers WHERE id = '${participantId}'`)
          .then(rows => {
            participants[rows[0].username] = participantSubmissionLink;
          }))
          .catch(err => {
            throw err;
          });

          await delayedLog(array[i]);
        }

        let contestTypeStr = '';

        if (themes.length > 1) {
          contestTypeStr = `\n\n*This is a ${contest.type} contest*`;
        }

        let voteLinkStr = '';
        if (voteLink) voteLinkStr = `\n\n[Vote link](${voteLink})`;

        // contest detail embed
        let embed = new Discord.RichEmbed()
        .setAuthor('Contest!', (contest.visibility == 'hidden') ? 'https://ice-creme.de/images/jabstat/hidden-icon.jpg' : 'https://ice-creme.de/images/jabstat/public-icon.jpg')
        .setTitle(contest.name)
        .setDescription(`${contest.description}${contestTypeStr}\n\nadd \`>contest submit ${contest.id}\` to your submission\n\nVoting will start after the deadline.${voteLinkStr}\n\n*Date: MM.DD.YYYY UTC*`)
        .setColor((contest.visibility == 'hidden') ? '#e74c3c' : '#3498db')
        .addBlankField()
        .addField('Start', startdate.dateStr, true)
        .addField('Deadline', enddate.dateStr, true)
        .addField('Themes:', `${themes.join('\n')}`)
        .setFooter(`beep boop • contest ID: ${contest.id}`, client.user.avatarURL);

        let participantString = [];

        for (let key in participants) {
          if (participants.hasOwnProperty(key)) {
            participantString.push(`[${key}](${participants[key]})`);
          }
        }

        // contest submission list
        let participantEmbed = new Discord.RichEmbed()
        .setDescription('click on the names to see the submission')
        .setColor((contest.visibility == 'hidden') ? '#e74c3c' : '#3498db')
        .addField('Submissions:', `- ${participantString.join('\n- ')}`)
        .setFooter(`beep boop`, client.user.avatarURL);

        message.channel.send({embed: embed}).then(() => {
          message.channel.send({embed: participantEmbed});
        });

      } // processContests

      processUsers(rows);
    }))
    .catch(err => {
      throw err;
    });


  // submit something
} else if (cmd == 'submit' || cmd == 's') {
  // adds users submission to the contest list
  let contestId = args[1];
  let submission, contestStart, contestEnd;

  message.attachments.forEach(att => {
    submission = att.url;
  });

  let submissionLink = `https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;

  if (isNaN(contestId)) {
    message.reply('please provide a proper contest Id');
    return message.delete();
  }
  if (!submission) return message.reply('please add an attachment to your submission');

  // check if contest is currently active
  let checkContest = new Promise((res, rej) => {
    db.execute(config, database => database.query(`SELECT * FROM contest WHERE id = '${contestId}'`)
    .then(rows => {
      if (rows.length < 1) {
        message.channel.send(`There is no contest with the ID ${contestId}`);
        message.delete();
        return;
      }

      contestStart = rows[0].startdate;
      contestEnd = rows[0].enddate;
      res(contestStart, contestEnd);
    }))
    .catch(err => {
      throw err;
    });
  });

  checkContest.then((contestStart, contestEnd) => {

    // if contest starts in the future
    if (contestStart > currentDate) {
      message.channel.send('This contest didn\'t even start yet.');
      return message.delete();
    // if contest is already closed
    } else if (contestEnd < currentDate) {
      message.channel.send('Too late. This contest is already over :sad_cett:');
      return message.delete();
    // go on
    } else {
      db.execute(config, database => database.query(`SELECT * FROM jabusers WHERE userID = '${message.author.id}'`)
      .then(rows => {
        let userID = rows[0].id;
        let username = rows[0].username;

        db.execute(config, database => database.query(`SELECT * FROM contestUsers WHERE userID = '${userID}' AND contestID = '${contestId}'`)
        .then(rows => {
          if (rows.length > 0) {
            message.reply('you already submitted something to this contest. You can delete it with `>contest submitdelete [id]`')
            return message.delete();
          }

          database.query(`INSERT INTO contestUsers (contestID, userID, submission, submissionLink) VALUES ('${contestId}', ${userID}, '${submission}', '${submissionLink}')`);
          message.react("👍");
          console.log(`added ${username}'s submission to contest ${cmd}'`);

        }))
        .catch(err => {
          throw err;
        });
      }))
      .catch(err => {
        throw err;
      });
    }
  });

  // remove submit
} else if (cmd == 'submitdelete' || cmd == 'sd') {
  // >contest submitdelete contestId
  // removes users submission from contest
  let contestId = args[1];

  if (!contestId) return message.channel.send('please provide a contest ID');

  db.execute(config, database => database.query(`SELECT * FROM jabusers WHERE userID = '${message.author.id}'`)
  .then(rows => {
    let userID = rows[0].id;

    db.execute(config, database => database.query(`SELECT * FROM contestUsers WHERE userID = '${userID}' AND contestID = '${contestId}'`)
    .then(rows => {
      if (rows.length < 1) return message.channel.send('you dont have a submission for this contest');
      database.query(`DELETE FROM contestUsers WHERE userID = '${userID}' AND contestID = '${contestId}'`);
      message.channel.send('submission deleted!');
    }))
    .catch(err => {
      throw err;
    });
  }))
  .catch(err => {
    throw err;
  });

  // contest list
} else if (cmd == 'list' || cmd == 'l') {
    let voteLink;
    let contests = [];
    db.execute(config, database => database.query(`SELECT * FROM contest ORDER BY startdate`)
    .then(rows => {
      if (rows.length < 1) return message.channel.send(`There are no contests <:sad_cett:487733321741107200>`);

      for (let i = 0; i < rows.length; i++) {
        let contestStartDate = new Date(rows[i].startdate);
        let contestEndDate = new Date(rows[i].enddate);

        // if the contest enddate is in the past -> line through
        if (contestEndDate < currentDate) {
          contests.push(`\`${rows[i].id}\` | \t~~${rows[i].name}~~`);
        } else if (contestStartDate <= currentDate && contestEndDate >= currentDate) {
          contests.push(`\`${rows[i].id}\` | \t__**${rows[i].name}**__`);
        } else {
          contests.push(`\`${rows[i].id}\` | \t${rows[i].name}`);
        }
      }

      let embed = new Discord.RichEmbed()
      .setAuthor('Contest list')
      .setDescription('type `>contest [id]` to get more informations')
      .addBlankField()
      // add Field "there are currently X contests" OR "there are no contests at the moment"
      .addField('All contests:', `${contests.join('\n')}`)
      .setColor('#3498db')
      .setFooter(`beep boop`, client.user.avatarURL);
      message.channel.send({embed: embed});

      return;
    }))
    .catch(err => {
      throw err;
    });

    // contest help
  } else if (cmd == 'startvote' || cmd == 'sv') {
    if(!message.member.hasPermission('MANAGE_MESSAGES')) return message.channel.send('You don\'t have permission to use this ');

    let contestId = args[1];
    if (isNaN(contestId)) {
      message.reply('please provide a proper contest Id `>c startvote [id]`');
      return message.delete();
    }

    console.log(`start vote: ${contestId}`);

    let contest, participants = [], themes = [], proceed = true;

    db.execute(config, database => database.query(`SELECT * FROM contest WHERE id = '${contestId}'`)
    .then(rows => {
      if (rows.length < 1) {
        message.channel.send(`There is currently no contest running.`);
        proceed = false;
      }

      if (rows[0].votelink) {
        proceed = false;
        message.channel.send(`There is already a voting.`);
        let embed = new Discord.RichEmbed()
        .setDescription(`[Go vote!](${rows[0].votelink})`);
        message.channel.send({embed: embed})
      }

      startdate = formatDate(rows[0].startdate);
      enddate = formatDate(rows[0].enddate);

      contest = rows[0];

      return database.query(`SELECT * FROM contestThemes WHERE contestId = '${contest.id}' ORDER BY startdate`);
    })
    .then(rows => {
      if (proceed) {
        if (rows.length < 1) {
          themes.push('not set');
        } else {
          for (let i = 0; i < rows.length; i++) {
            let themeStart = formatDate(rows[i].startdate);
            let themeEnd = formatDate(rows[i].enddate);

            // if the startdate of the theme is in the future && its a hidden contest hide the theme
            if (themeStart.date > currentDate && contest.visibility == 'hidden') {
              themes.push('- ' + '\\*'.repeat(rows[i].name.length));
            } else if (themeEnd.date < currentDate) {
              // if the theme is already over => line through
              themes.push(`- ~~${rows[i].name}~~`);
            } else if (themeStart.date <= currentDate && themeEnd.date >= currentDate) {
              // if the theme is right now => bold & underlined
              themes.push(`- __**${rows[i].name}**__`);
            } else {
              themes.push(`- ${rows[i].name}`);
            }
          }
        }

        return database.query(`SELECT * FROM contestUsers WHERE contestID = '${contest.id}'`);
      }
    })
    .then(rows => {
      if (proceed) {
        function delay() {
          return new Promise(resolve => setTimeout(resolve, 300));
        }

        async function delayedLog(item) {
          await delay();
        }

        async function processUsers(array) {

          for (let i = 0; i < array.length; i++) {
            let participantId = array[i].userID;
            let participantSubmissionLink = array[i].submissionLink;
            db.execute(config, database => database.query(`SELECT * FROM jabusers WHERE id = '${participantId}'`)
            .then(rows => {
              participants[rows[0].username] = participantSubmissionLink;
            }))
            .catch(err => {
              throw err;
            });

            await delayedLog(array[i]);
          }

          let voteEmotesRaw = ['🥞', '🍗', '🌭', '🍕', '🍙', '🍣', '🍤', '🍦', '🍩', '🍪', '🍫', '🍯', '🍬', '🍭', '🦐', '🍥', '🍘', '🍱', '🥗', '🍲'];
          function shuffle(a) {
            var j, x, i;
            for (i = a.length - 1; i > 0; i--) {
              j = Math.floor(Math.random() * (i + 1));
              x = a[i];
              a[i] = a[j];
              a[j] = x;
            }
            return a;
          }

          let voteEmotes = shuffle(voteEmotesRaw);

          let participantString = [];

          let i = 0;

          for (let key in participants) {
            if (participants.hasOwnProperty(key)) {
              participantString.push(`${voteEmotes[i]} [${key}](${participants[key]})`);
              i++;
            }
          }

          //
          function delay() {
            return new Promise(resolve => setTimeout(resolve, 300));
          }

          async function delayedReact(item) {
            await delay();
          }
          //

          // contest detail embed
          let embed = new Discord.RichEmbed()
          .setAuthor('Voting!', 'https://ice-creme.de/images/jabstat/voting.jpg')
          .setTitle(`Contest: ${contest.name}`)
          .setDescription(`${contest.description}\n\n*use the reactions to vote*`)
          .setColor('#2ecc71')
          .addBlankField()
          .addField('Themes:', `${themes.join('\n')}`)
          .addBlankField()
          .addField('Submissions:', `*use the reactions to vote*\n${participantString.join('\n')}`)
          .addBlankField()
          .setFooter(`beep boop • contest ID: ${contest.id}`, client.user.avatarURL);

          message.channel.send({embed: embed}).then(msg => {
            voteLink = `https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id}`;
            async function processReacts(array) {
              for (let i = 0; i < array.length; i++) {
                msg.react(`${voteEmotes[i]}`);
                await delayedReact(array[i]);
              }
              console.log('done!');
              db.execute(config, database => database.query(`UPDATE contest SET votelink = '${voteLink}' WHERE id = '${contest.id}'`)
              .then(() => {
                console.log('inserted voteLink');
              }))
              .catch(err => {
                throw err;
              });
            }
            processReacts(participantString);
          });

        } // processContests

        processUsers(rows);
      }
    }))
    .catch(err => {
      throw err;
    });




  } else if (cmd == 'help' || cmd == 'h') {

    let embed = new Discord.RichEmbed()
    .setAuthor('Contest help')
    .setDescription('```MD\n*use >contest or >c*\n\n>contest\n===\nshow the active contest\n\n>contest list\n===\nget a list of all contests\n\n>contest [id]\n===\nget detailed information about that contest\n\n>contest submit [id]\n===\nadd this to an attachment to submit something\n\n>contest submitdelete [id]\n===\ndelete your submission```')
    .setColor('#3498db')
    .setFooter(`beep boop`, client.user.avatarURL);
    message.channel.send({embed: embed});

  } else {
    message.channel.send('type `>contest help` for more informations');
    message.delete();
  }

}

module.exports.help = {
  name: 'contest',
  alias: 'c',
  description: 'more information for current contests',
  usage: '',
  admin: false
}
