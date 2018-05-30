class AddColumnSintomaToRelato < ActiveRecord::Migration[5.2]
  def change
    add_column :relatos, :Sintoma, :string
  end
end
