class CreateRelatos < ActiveRecord::Migration[5.2]
  def change
    create_table :relatos do |t|
      t.string :titulo
      t.text :relato

      t.timestamps
    end
  end
end
