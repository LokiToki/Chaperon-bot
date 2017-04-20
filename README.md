# Chaperon-bot
A friendly chaperon bot based on nodeJS with IRC package and Winston logger.

This bot is a classical helper to censor "forbidden" words. The native and only language until now (04/2017) is English. 
The default functionality is that the bot exhort people who are using words from the `badwords.json` file (feel free to add words in your local clone). After 3 exhorts the bot kicks the user from the channel when the bot has the necessary rights. Otherwise he just keep on exhorting people. The exhort-counter of garish user will be reset after an hour. 

User can report other users for being garish as well. The report is sent to the bot owner and stored in a separate log file (warn.log).   

# Installation
## Preconditions 
You just need some little things for running the bot. It’s nothing special and everyone can get it easy and for free.

On a debian-based Linux:
* sudo apt-get nodejs npm
* npm install [irc](https://github.com/martynsmith/node-irc)
* npm install [winston](https://github.com/winstonjs/winston)

For further information and other platforms visit: [https://nodejs.org/en/download/package-manager/](https://nodejs.org/en/download/package-manager/)

## Installation of the bot
Just clone the Git Repo and you are almost done. To configure the bot you need to edit the `master_example.js` and `secconf_example.js` files in the `private` folder and rename them to `master.js` and  `secconf.js` (due to the personal information in these files never share them with other).

Furthermore you can edit the `lilly.js` file to edit IRC server and channels. If your bot is not registrated on the irc server yet just disable SASL by changing the line

`config.sasl = true;`
 to
`config.sasl = false;`.

The login credentials in the `secconf.js` file will be ignored. 

Now you are ready to go and you can run the bot with `node lilly.js`. Rename the file to any other name if you want.

# Configuration
## The `master.js` file
In this file are information about the bot owner. Until now they are almost unused but prevent the owner from being kicked and enable him to speak through the bot. The fields are self-explaining.

## The `secconf.js` file
To configure the bot with secure information these file was created. `userName` and  `password` are required for the SASL login if your bot is registered on the IRC server. `nick` is the nick of the bot. 

## Admonition
In the `admonition.json` file in the `resources` folder are the exhortations the bot uses. You can add some if you want. Follow these construct:

`"%FROM%, na na na, don't be so rude!"` 

The %FROM% is the placeholder which is replaced with the name of the troublemaker. 

## Adding bad words 
Also in the `resources` folder is the `badwords.json` file. Feel free to add bad word to your taste.

#Usage
## Normal functionality
The bot reads every message in the channel he or she has joined. Every user can talk to the bot with these comands:

In channel:
* `!help <nick>`
* `!report <troublemakernick> <reason>`

Via PM:
* `/msg <botnick> help`
* `/msg <botnick> report <troublemakernick> <reason fits in here>`

Until now every command is usabele in channel and private message.

## Special Owner-Commands
As the bot Owner you have some privileges. You can speak through the bot. This works only via private message:

* `/msg <botnick> <#channel> <your message here>`

A channel is mandatory. A broadcast to all channels is not possible yet.

# Custom functionality
Due to the easy interface of the bot you can add own functions. There is an object with the name `commands`. It holds all commands in this format:

`report: function(from, text){report(from,text);} `

In this case `report:` is the keyword the bot will react on (pm and channel) and the `function(from, text){...}` is the function which is called when the keyword is used. You are free to call another function which has to be implemented e.g. at the bottom of the file or do anything else. The parameter `from` and `text` are mandatory.

# Further information
This is my first JS bot. Feel free to make suggestions or fire up a pull request. I hope you like  it. If so you can buy me a coffee:

GRC: S2gHzPt2gec5XQ3ZAsFNY6kXkRHv27vyDF

## Road-map
* cleaner use of command functions
* winston conf file
* owner-function to enable/disable the bot without shutting it down
