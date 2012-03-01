require 'railsless-deploy' 
load 'config/defs.rb'

# rvm
$:.unshift(File.expand_path('./lib', ENV['rvm_path']))
require "rvm/capistrano"
set :rvm_ruby_string, '1.9.2-p290-patched'
set :rvm_type, :system
# /rvm

default_run_options[:pty] = true
ssh_options[:forward_agent] = true
set :application, "socketio"
set :repository,  "git@github.com:brewster/socket.io-proxy.git"
set :scm, :git
set :user, ENV['BREWSTER_USER'] || ENV['USER']
set :deploy_via, :remote_cache
set :use_sudo, true
set :admin_runner, "root"
set :keep_releases, 3
set :concurrent_restarts, 2
set :deploy_lockfile, "#{shared_path}/log/deploy_lockfile.txt"

task :production do
  set :rails_env, "production"
  set :branch, 'production'
  #server 'prod-dims-r01', :app, :db, :primary => true
  #server 'prod-dims-r02', :app
  #server 'prod-dims-r03', :app
  #server 'prod-dims-r04', :app
  #server 'prod-dims-r05', :app
  #server 'prod-dims-r06', :app
  #server 'prod-dims-r07', :app
  #server 'prod-dims-r08', :app
  #server 'prod-dims-r09', :app
  #server 'prod-dims-r10', :app
end

task :staging do
  set :rails_env, "staging"
  set :branch, 'staging'
  server 'staging-fe-r01', :app, :db, :primary => true
end

# Lock deploy, :migrations, :pre_migrations
%w(deploy deploy:migrations deploy:pre_migrations).each do |lock|
  before(lock.to_sym, 'deploy:lock'.to_sym)
end

# update symlinks after code is updated and fix perms; cleanup old releases
before "deploy", "deploy:fix_cached_copy_perms"
after "deploy:update_code", "deploy:fix_perms", "deploy:symlink_configs"
after "deploy:update", "deploy:restart", "deploy:unlock", "deploy:cleanup"

## Spam IRC with our intentions
%w(deploy deploy:migrations deploy:pre_migrations).each do |hook|
  before(hook.to_sym, 'irc:notify_before_deploy'.to_sym)
  after(hook.to_sym, 'irc:notify_after_deploy'.to_sym)
end

namespace :irc do
  desc "Tell #BrewsterBots that we're about to do a deploy"
  task :notify_before_deploy do
    begin
      logger.info "\e[0;31;1mNOTICE:\e[0m Notifying IRC that we're deploying."
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
      logger.info "\e[0;31;1mNOTICE:\e[0m Notifying IRC that we're done deploying."
      $dmsg = "#{application}: #{user} has FINISHED deploying to #{rails_env}."
      cinchbot.start
    rescue Exception => e
      # No need to let this ruin our day.
      STDERR.puts("Unable to notify IRC of deploy: #{e.message}")
    end
  end
end

## Start deploying
namespace :deploy do
  task :start do ; end
  task :stop do ; end

  ## Create deploy lockfiles
  task :lock, :roles => :app do
    check_lock
    logger.info "\e[0;31;1mATTENTION:\e[0m Creating deploy lockfile..."
    msg = fetch(:lock_message, 'Cap generated lock message')
    timestamp = Time.now.strftime("%m/%d/%Y %H:%M:%S %Z")
    lock_message = "Deploys locked by #{ENV['USER']} at #{timestamp}: #{msg}"
    put lock_message, "#{deploy_lockfile}", :mode => 0664
    run "chgrp eng #{deploy_lockfile}"
  end

  ## Check for lockfiles
  desc "Check if deploys are OK here or if someone has locked down deploys"
  task :check_lock, :roles => :app do
  run "cat #{deploy_lockfile};echo" do |ch, stream, data|
    if data =~ /Deploys locked by/
        logger.info "\e[0;31;1mABORTING:\e[0m #{data}"
        abort 'Deploys are locked on this machine'
      else
        logger.info "\e[0;31;1mNOTICE:\e[0m No lockfile found."
      end
    end
  end

  ## Remove lockfiles
  desc "Remove the deploy lock"
  task :unlock, :roles => :app do
    logger.info "\e[0;31;1mNOTICE:\e[0m Removing deploy lockfile..."
    run "rm -f #{deploy_lockfile}; echo"
  end

  ## restart
  desc "Restart app"
  task :restart, :roles => :app do
    if rails_env == 'production'
      servers = find_servers_for_task(current_task)
      servers.each_slice(concurrent_restarts) do |group|
        filter_hosts(group) do
          # TEMP
          run "#{sudo :as => "root"} monit restart prod_nodejs_socketio", :hosts => group
          sleep 10
          #logger.info "\e[0;31;1mNOTICE:\e[0m Disabling monitoring for #{group} via => monit unmonitor prod_nodejs_socketio"
          #run "#{sudo :as => "root"} monit unmonitor prod_nodejs_socketio", :hosts => group
  
          #logger.info "\e[0;31;1mNOTICE:\e[0m Draining #{group} from VIP and sleeping"
          #run "echo 500 >#{shared_path}/config/code", :hosts => group
  
          #sleep 30
  
          #logger.info "\e[0;31;1mNOTICE:\e[0m Restarting #{group} via => monit restart prod_nodejs_socketio"
          #run "#{sudo :as => "root"} monit restart prod_nodejs_socketio", :hosts => group
  
          #logger.info "\e[0;31;1mNOTICE:\e[0m Re-enabling #{group} in VIP"
          #run "echo 200 >#{shared_path}/config/code", :hosts => group
  
          #sleep 2
        end
      end
    elsif rails_env == 'staging'
      servers = find_servers_for_task(current_task)
      servers.each_slice(concurrent_restarts) do |group|
        filter_hosts(group) do
          logger.info "\e[0;31;1mNOTICE:\e[0m Restarting #{group} via => monit restart prod_nodejs_socketio"
          run "#{sudo :as => "root"} monit restart staging_nodejs_socketio", :hosts => group
        end
      end
    end
  end

  task :symlink_configs, :except => { :no_release => true } do
    %w(config.json code).each do |f|
      run "ln -svf #{shared_path}/config/#{f} #{release_path}/#{f}"
    end
  end

  task :fix_perms, :except => { :no_release => true } do
    logger.info "\e[0;31;1mNOTICE:\e[0m Changing group and perms on #{release_path}"
    run "#{sudo :as => "root"} chown -R deploy:eng #{release_path};echo"
  end

  task :fix_cached_copy_perms, :except => { :no_release => true } do
    logger.info "\e[0;31;1mNOTICE:\e[0m Changing group and perms on #{shared_path}/cached-copy/"
    run "#{sudo :as => "root"} rm -rf #{shared_path}/cached-copy; echo"
  end

end
