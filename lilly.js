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
config.server = "irc.freenode.net";
config.channels = ['#gridcoin', '#botwars'];
config.sasl = true; // IMPORTANT: set this true if your bot is registrated on target irc server (credentials from secconf will be used)
config.secure = true; // Enables SSL - mandatory to join some channels
config.selfSigned = true; // SSL cert self sig
config.port = 6697; // set to SSL port

var iammodinchannels = [];

// Get the lib
var irc = require("irc");

// Create the bot name
var bot = new irc.Client(config.server, config.nick, config);

// files with forbidden words
var badwords = require('./resources/badwords.json');

// file with admonation for the bot
var admonition = require('./resources/admonition.json');

var firstword;
var global_nicks = [];

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
	if(from == master.name || from == config.nick){}
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
				
				if(graylist[from] >= 3){
					if(iammodinchannels.indexOf(to) != -1){
						graylist[from] = 0;
						bot.send('kick', to, from, "He that will not hear must feel! ^__^`");
					}else{
						winston.warn(from + " reported: " + " Autoreport. Last misdemeanor: " + text);
						bot.say(to, from + ", you have been reported due to misbehavior. Lucky you! I'm not in the position to take you to the woodshed. ^_^`");
						graylist[from] = 0;
					}
				}
				return;
			}
		}
	}
	
	if(text.search(config.nick) != -1){
		responseToChannel(from, to, text); 
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
		iammodinchannels.push(channel);
		bot.say(channel, "Thank you very much " + by + ". I will bear this special burden with reverence.");
	}
});

bot.addListener("-mode", function (channel, by, mode, argument, message) {
	if(argument == config.nick && ( mode == 'o' || mode == 'a')){
		var indexOfRemovedChannel = iammodinchannels.indexOf(channel); 
		iammodinchannels.splice(indexOfRemovedChannel,1);
		bot.say(channel, "It was an honor to serve you, " + by);
	}
});


bot.addListener("names", function (channel, nicks) {
	global_nicks[channel] = nicks;
});


function printHelp(from){
	bot.say(from, "Dear " + from +", I'm readdy to serve you and the community. Things i can do for you:\n" +  
	"PM:\n /msg " + config.nick + " report <name> <reason> - You can report someone who offends you or missbehaves in the channel.\n");
}

function report(from, text){
	
	var plain_report_with_name = text.slice(firstword.length+1);
	var reported_nick = plain_report_with_name.substr(0, plain_report_with_name.indexOf(" ")); 
	var plain_report_msg = plain_report_with_name.slice(plain_report_with_name.indexOf(" ")+1);
	
	if(!findUserInMyChannels(reported_nick)){
		bot.say(from, "I'm really sorry, but i can't find " + reported_nick + " in my moderated channels.")
	}else if(from == reported_nick){
		bot.say(from, "Sorry, but you can't report yourself.");
	}else if(reported_nick == master.name){
		bot.say(from, "You are not the sharpest tool in the box if you think i report my master...to my master. ^_^`");
	}else{
		bot.say(from, "Dear " + from +", your report has been send to my master. Reason: '" + plain_report_msg + "'. He will review it as soon as possible. Thank you very much.");
		winston.warn(from + " reported: " + plain_report_with_name);
	}
}


function findUserInMyChannels(reported_nick){
	winston.warn("channels in function: " + config.channels);
	for(i = 0; i < config.channels.length; i++)
	{
		if(global_nicks[config.channels[i]].hasOwnProperty(reported_nick)) return true;
	}
	return false;
}
	

function findChannel(channel){
	return channel == firstword;
}

function responseToChannel(from, to, text){
	if((text.toLowerCase().search("bot ") != -1 || text.toLowerCase().search(" bot") != -1) && text.search("\\?") != -1){
		bot.say(to, "If you are asking if I'm a bot then I have to answer 'Yes'.");
	}
	else if(text.toLowerCase().search("i like you") != -1 || text.toLowerCase().search("i love you") != -1)
	{
		bot.say(to, "Oh " + from + ", please...don't put me to the blush. I'm very shy. #^.^#");
	}
	else if(text.toLowerCase().search("i hate you") != -1 || text.toLowerCase().search("i don't like you") != -1)
	{
		bot.say(to, from + ", from the deepest desires often come the deadliest hate.");
	}
	else if(text.toLowerCase().search("penguins") != -1 && text.toLowerCase().search("fly") != -1)
	{
		bot.say(to, "Penguions cannot fly because they don't have enough money to buy plane tickets!");
	}
}
