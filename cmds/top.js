const config = module.require('./../utility/config.js');
const Discord = require('discord.js');

module.exports.run = async(client, message, args, db) => {

  let users = [];

  db.execute(config, database => database.query(`SELECT * FROM stat_members WHERE deleted = "1" AND joinedAt IS NOT NULL ORDER BY updated DESC`)
  .then(rows => {
    if (rows.length < 1) {
      throw new Error('nothing found');
      return null;
    }

    rows.forEach(row => {
      let user = {};

      user.userId = row.userId;
      user.name = row.username;

      user.joinedAt = new Date(row.joinedAt);

      let updated = new Date(row.updated);
      updated.setTime(updated.getTime() + (1 * 60 * 60 * 1000));
      user.updated = updated;

      // if (row.agreedAt != null) {
      //   let agreed = new Date(row.agreedAt);
      //   agreed.setTime(agreed.getTime() + (1 * 60 * 60 * 1000));
      //   user.agreed = agreed;
      // } else {
      //   user.agreed = null;
      // }
      //
      // if (row.introducedAt != null) {
      //   let introduced = new Date(row.introducedAt);
      //   introduced.setTime(introduced.getTime() + (1 * 60 * 60 * 1000));
      //   user.introduced = introduced;
      // } else {
      //   user.introduced = null;
      // }

      // get difference between join and leave date
      let delta = Math.abs(user.updated - user.joinedAt) / 1000;
      let ogDelta = delta;

      // calculate (and subtract) whole days
      let days = Math.floor(delta / 86400);

      // calculate (and subtract) whole hours
      let hours = Math.floor(delta / 3600) % 24;
      delta -= hours * 3600;

      // calculate (and subtract) whole minutes
      let minutes = Math.floor(delta / 60) % 60;
      delta -= minutes * 60;

      // what's left is seconds
      let seconds = delta % 60;

      user.diff = ogDelta;
      // user.diffDays = days;
      // user.diffHours = hours;
      // user.diffMinutes = minutes;
      // user.diffSeconds = seconds;
      user.difference = `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;

      users.push(user)
    });

    return;
  })
  .then(() => {
    users.sort((a, b) => parseFloat(a.diff) - parseFloat(b.diff));
    users = users.slice(0, 10);
    console.log(users);

    let topString = '';

    users.forEach(u => {
      let delta = Math.abs(u.updated - u.joinedAt) / 1000;
      let days = Math.floor(delta / 86400);
      let hours = Math.floor(delta / 3600) % 24;
      delta -= hours * 3600;
      let minutes = Math.floor(delta / 60) % 60;
      delta -= minutes * 60;
      let seconds = delta % 60;

      let line = `**${u.name}**: ${minutes}min ${seconds}sec`;
      topString += `${line}\n`;
    });

    let embed = new Discord.RichEmbed()
    .setAuthor(`Leave times`)
    .setDescription(`Duration between joining the server and leaving`)
    .setColor('#EF3340')
    .addField('Top 10:', topString)
    .setFooter(`beep boop`, client.user.avatarURL);

    message.channel.send({embed: embed});
  }))
  .catch(err => {
    if (err.message == 'nothing found') {
      message.channel.send(`No records found`)
    } else {
      // logger.error(err, {logType: 'error', time: Date.now()});
      throw err;
    }
    });
}

module.exports.help = {
  name: 'top',
  alias: 't',
  description: 'show some top lists',
  usage: '[listname]',
  admin: false
}