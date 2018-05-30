class RelatosController < ApplicationController
	before_action :set_relato, only:[:show, :edit, :update, :destroy]
	before_action :authenticate_user!
	
	def index
		@relatos = Relato.where(user_id: current_user).order("created_at DESC")
	    if params[:search]
	      @relatos = Relato.where("titulo like ?","%#{params[:search]}%")
	    else
	      @relatos = Relato.all
	    end
    
  end

	def new
		@relato = Relato.new
	end

	def show
	end

	def create
		@relato = Relato.new(relato_params)
		if @relato.save
			redirect_to @relato
		else
			render 'new'
		end
	end

	def edit
	end

	def update
		if @relato.update(relato_params)
			redirect_to @relato
		else
			render 'edit'
		end
	end

	def destroy
		@relato.destroy
		redirect_to relatos_path
	end


		private

		def relato_params
			params.require(:relato).permit(:titulo,:relato, :Sentimento)
		end

		def set_relato
			@relato = Relato.find(params[:id])
		end

end
