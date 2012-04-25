namespace :perms do
  task :fix_repo_perms, :except => { :no_release => true } do
    logger.notice "Changing group and perms on #{release_path}"
    run "#{sudo :as => "root"} chown -R deploy:eng #{release_path};echo"
  end

  task :fix_cached_copy_perms, :except => { :no_release => true } do
    logger.notice "Changing group and perms on #{shared_path}/cached-copy/"
    run "#{sudo :as => "root"} rm -rf #{shared_path}/cached-copy; echo"
  end
end

