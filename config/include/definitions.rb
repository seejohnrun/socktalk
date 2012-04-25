# definitions
def filter_hosts(hosts)
  begin
    real_hostfilter = ENV['HOSTFILTER']
    ENV['HOSTFILTER'] = Array(hosts).join(',')
    yield
  ensure
    ENV['HOSTFILTER'] = real_hostfilter
  end
end

# our colourful custom loggers
class Capistrano::Logger
  def notice(msg)
    self.info msg, "NOTICE".foreground(:blue)
  end
  def attention(msg)
    self.important msg, "ATTENTION".foreground(:yellow)
  end
  def aborting(msg)
    self.important msg, "ABORTING".foreground(:red)
  end
end

