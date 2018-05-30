class Message
	include ActiveModel::Model
	attr_accessor :name, :clientemail, :body
	  validates :name, :clientemail, :body, presence: true
end
