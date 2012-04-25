namespace :misc do  
  task :symlink_configs, :except => { :no_release => true } do
    %w(config.json code).each do |f|
      logger.notice "Symlinking config => #{f}"
      run "ln -svf #{shared_path}/config/#{f} #{release_path}/#{f}"
    end
  end
end

