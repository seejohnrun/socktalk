# definitions and other unwieldy bits

begin
  require 'cinch'
rescue LoadError
  abort "No soup for you! =>gem install cinch"
end

def filter_hosts(hosts)
  begin
    real_hostfilter = ENV['HOSTFILTER']
    ENV['HOSTFILTER'] = Array(hosts).join(',')
    yield
  ensure
    ENV['HOSTFILTER'] = real_hostfilter
  end
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
