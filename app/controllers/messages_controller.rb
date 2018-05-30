class MessagesController < ApplicationController

def new
	@message = Message.new
end

 def create
    @message = Message.new(message_params)
    if @message.valid?
    	MessageMailer.contact_me(@message).deliver_now
      	redirect_to new_message_url, notice: "Mensagem recebida, Obrigado!"
    else
      	render :new
    end
 end

 private

  def message_params
    params.require(:message).permit(:name, :clientemail, :body)
  end

end
