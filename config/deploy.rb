require 'rainbow'
require 'railsless-deploy' 

# load our includes
load 'config/include/irc.rb'
load 'config/include/misc.rb'
load 'config/include/perms.rb'
load 'config/include/definitions.rb'

# rvm
require "rvm/capistrano"
set :rvm_ruby_string, '1.9.2-p290-patched'
set :rvm_type, :system
# /rvm

default_run_options[:pty] = true
ssh_options[:forward_agent] = true
set :application, "socketio"
set :scm, :git
set :user, ENV['BREWSTER_USER'] || ENV['USER']
set :deploy_via, :remote_cache
set :use_sudo, true
set :admin_runner, "root"
set :keep_releases, 3
set :concurrent_restarts, 1
set :max_hosts, 25 || ENV['MAXHOSTS']
set :deploy_lockfile, "#{shared_path}/log/deploy_lockfile.txt"

task :production do
  set :rails_env, "production"
  set :branch, 'production'
  server 'prod-sockio-r01', :app
  server 'prod-sockio-r02', :app
end

task :staging do
  set :rails_env, "staging"
  set :branch, 'staging'
  server 'staging-fe-r01', :app
end

# Set repo via env, git-r01 as default
if ENV['REPO'] == 'github'
  set :repository, "git@github.com:brewster/socktalk.git"
else
  set :repository, "git://git-r01.ihost.brewster.com/git/socktalk.git"
end

# update origin in case we need to deploy from a diff location
task :update_origin, :roles => :app do
  logger.notice "Updating remote origin..."
  run "[[ -d #{shared_path}/cached-copy ]] && cd #{shared_path}/cached-copy && git remote set-url origin #{repository} || true"
end


## Start deploying
namespace :deploy do
  task :start do ; end
  task :stop do ; end

  task :default do
    lock
    irc.notify_before_deploy
    perms.fix_cached_copy_perms
    update
    misc.symlink_configs
    perms.fix_repo_perms
    restart
    cleanup
    unlock
    irc.notify_after_deploy
  end


  # set max_hosts on update_code, set custom origin
  task :update_code, :except => { :no_release => true }, :max_hosts => "#{max_hosts}" do
    update_origin
    logger.notice "Pulling repo from #{repository}: max_hosts => '#{max_hosts}'"
    on_rollback { run "rm -rf #{release_path}; true" }
    strategy.deploy!
    finalize_update
  end


  ## Create deploy lockfiles
  task :lock, :roles => :app do
    check_lock
    logger.notice "Creating deploy lockfile"
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
        logger.aborting "#{data}"
        abort 'Deploys are locked on this machine'
      end
    end
    logger.notice "No lockfiles found"
  end

  ## Remove lockfiles
  desc "Remove the deploy lock"
  task :unlock, :roles => :app do
    logger.notice "Removing deploy lockfile"
    run "rm -f #{deploy_lockfile}; echo"
  end

  ## restart
  desc "Restart app"
  task :restart, :roles => :app do
    if rails_env == 'production'
      servers = find_servers_for_task(current_task)
      servers.each_slice(concurrent_restarts) do |group|
        filter_hosts(group) do
          logger.attention "Disabling monitoring for #{group} via => monit unmonitor prod_nodejs_socketio"
          run "#{sudo :as => "root"} monit unmonitor prod_nodejs_socketio", :hosts => group
  
          logger.attention "Draining #{group} from VIP and sleeping"
          run "echo 500 >#{shared_path}/config/code", :hosts => group
  
          sleep 30
  
          logger.attention "Restarting #{group} via => monit restart prod_nodejs_socketio"
          run "#{sudo :as => "root"} monit restart prod_nodejs_socketio", :hosts => group
  
          logger.attention "Re-enabling #{group} in VIP"
          run "echo 200 >#{shared_path}/config/code", :hosts => group
  
          #sleep 2
        end
      end
    elsif rails_env == 'staging'
      servers = find_servers_for_task(current_task)
      servers.each_slice(concurrent_restarts) do |group|
        filter_hosts(group) do
          logger.notice "Restarting #{group} via => monit restart prod_nodejs_socketio"
          run "#{sudo :as => "root"} monit restart staging_nodejs_socketio", :hosts => group
        end
      end
    end
  end
end
