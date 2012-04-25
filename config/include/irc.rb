begin
  require 'cinch'
rescue LoadError
  abort "No soup for you! =>gem install cinch"
end

# IRC
set :cinchbot do
  bot = Cinch::Bot.new do
    configure do |c|
      c.server = "irc.ihost.brewster.com"
      c.port = "6667"
      c.reconnect = false
      c.verbose = false
      c.channels = ["#BrewsterBots"]
      c.password = "noSOUP4u"
      c.nick = "deploybot"
    end
    on :join, do |a|
      a.reply "#{$dmsg}"
      bot.quit
    end
  end
end

namespace :irc do
  desc "Tell #BrewsterBots that we're about to do a deploy"
  task :notify_before_deploy do
    begin
      logger.notice "Notifying IRC that we're deploying."
      $dmsg = "#{application}: #{user} is deploying to #{rails_env} with branch #{branch}."
      cinchbot.start
    rescue Exception => e
      # No need to let this ruin our day.
      STDERR.puts("Unable to notify IRC of deploy: #{e.message}")
    end
  end

  desc "Tell #BrewsterBots that we're done deploying"
  task :notify_after_deploy do
    begin
      logger.notice "Notifying IRC that we're done deploying."
      $dmsg = "#{application}: #{user} has FINISHED deploying to #{rails_env}."
      cinchbot.start
    rescue Exception => e
      # No need to let this ruin our day.
      STDERR.puts("Unable to notify IRC of deploy: #{e.message}")
    end
  end
end

