Rails.application.routes.draw do
  devise_for :users
  #devise_for :installs
  root 'welcome#index'

  resources :relatos

  get 'contact-me', to: 'messages#new', as: 'new_message'
   post 'contact-me', to: 'messages#create', as: 'create_message'



end

  #post  'relatos/create'
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
