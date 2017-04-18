var winston = require('winston');
winston.configure({
  transports: [
    new (winston.transports.File)({
      name: 'info-file',
      filename: 'info.log',
      level: 'info',
      maxsize: 1024 * 1024 * 30
    }),
    new (winston.transports.File)({
      name: 'warn-file',
      filename: 'warn.log',
      level: 'warn'
    })
  ]
});
  
// Create the configuration with login data (PRIVATE)
var config = require('./private/secconf');

// Create a object with infomation about the bot owner (PRIVATE)
var master = require('./private/master');

// Additionell configurations see: http://node-irc.readthedocs.io/en/latest/API.html
config.channels = [ '#mychaneel'];
config.server = "irc.freenode.net";
config.sasl = true; // IMPORTANT: set this true if your bot is registrated on target irc server (credentials from secconf will be used)
config.iammodinchannels = [];

// Get the lib
var irc = require("irc");

// Create the bot name
var bot = new irc.Client(config.server, config.nick, config);

// files with forbidden words
var badwords = require('./resources/badwords.json');

// file with admonation for the bot
var admonition = require('./resources/admonition.json');

var firstword;

// Commands the bot will notice (react with afunction)
var commands = {
	help: function(from, text){if(text.search(config.nick) != -1) printHelp(from);},
	report: function(from, text){report(from,text);}
};

// Reset badword-counter 
setInterval(function(){
	if(Object.getOwnPropertyNames(graylist).length != 0){
		graylist = {};
		winston.warn("Graylist reseted");
	}
}, 1000 * 60 * 60);    

// Graylist of warned users
var graylist = {};

// Listen for any message in the room
bot.addListener("message#", function(from, to, text, message) {
	if(from == master.name || from == config.nick){
	}
	else{
		for (i = 0; i < badwords.length; i++) {
			if(text.toLowerCase().search(badwords[i]) != -1){
				
				var admonition_number = Math.floor((Math.random() * admonition.length))
				bot.say(to, admonition[admonition_number].replace("%FROM%",from));
				
				if(graylist.hasOwnProperty(from))
					graylist[from] += 1;
				else 
					graylist[ from ] = 1;
					
				winston.info(from + " wrote " + ">>" + text + "<< Warning: " + graylist[from] + " ");
				
				if(graylist[from] >= 3 && config.iammodinchannels.indexOf(to) != -1){
					graylist[from] = 0;
					bot.send('kick', to, from, "He that will not hear must feel! ^__^`");
				}
			}
		}
	}
	
	firstword = text.substr(0, text.indexOf(" "));
	if (firstword == "") firstword = text;
	
	if(commands.hasOwnProperty(firstword.slice(1)) && firstword[0] == '!')
		commands[firstword.slice(1)](from,text);	
});



// Listen for any private message to him/her
bot.addListener("pm", function(from, text, message) {
	
	firstword = text.substr(0, text.indexOf(" "));
	
	if(from == config.nick){	
	}else if(from == master.name){	
		if(config.channels.findIndex(findChannel) != -1)
			bot.say(firstword, text.replace(firstword, "").slice(1));
		else
			bot.say(master.name, "No such channel");
	}
	else{
		if (firstword == "") firstword = text;
		if(commands.hasOwnProperty(firstword))
				commands[firstword](from,text);
		else
			bot.say(from, text + " is an invalid comand or parameter are missing. PM me with 'help' or write '!help " + config.nick + "' in a channel I'm in and I tell you more about me."); 
		}	
});

bot.addListener("+mode", function (channel, by, mode, argument, message) {
	if(argument == config.nick && ( mode == 'o' || mode == 'h')){
		config.iammodinchannels.push(channel);
		bot.say(channel, "Thank you very much " + by + ". I will bear this special burden with reverence.");
	}
});

bot.addListener("-mode", function (channel, by, mode, argument, message) {
	if(argument == config.nick && ( mode == 'o' || mode == 'a')){
		var indexOfRemovedChannel = config.iammodinchannels.indexOf(channel); 
		config.iammodinchannels.splice(indexOfRemovedChannel,1);
		bot.say(channel, "It was an honor to serve you, " + by);
	}
});


function printHelp(from){
	bot.say(from, "Dear " + from +", I'm readdy to serve you and the community. Things i can do for you:\n" +  
	"PM:\n /msg " + config.nick + " report <name> <reason> - You can report someone who offends you or missbehaves in the channel.\n");
}

function report(from, text){
	
	var plain_report_with_name = text.slice(firstword.length+1);
	var plain_report_msg = plain_report_with_name.slice(plain_report_with_name.indexOf(" ")+1);
	
	bot.say(from, "Dear " + from +", your report has been send to my master. Reason: '" + plain_report_msg + "'. He will review it as soon as possible. Thank you very much.");
	winston.warn(from + " reported: " + plain_report_with_name);
}

function findChannel(channel){
	return channel == firstword;
}
