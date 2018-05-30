class AddColumnSentimentoToRelato < ActiveRecord::Migration[5.2]
  def change
    add_column :relatos, :Sentimento, :string
  end
end
