1. vaults
Stores your different storage chests (Main Stash, Savings, etc.).

- id (Primary Key)
- name (Text: "Main Stash", "Savings Chest")
- is_default (Boolean: to identify your primary vault)
- description (Text: optional notes like "Primary storage for loot")
- user_id (Foreign Key -> users.id)

2. transactions
Records every piece of loot gained or gold spent.

- id (Primary Key)
- amount decimal
- is_expense bool
- vault_id (Foreign Key -> vaults.id)
- name (Text: "Tavern Ale", "Bounty Reward")
- created_at (Timestamp: for analytics and history)
- frequency (Text: "Weekly", "Monthly")
- day_of_generation (number: 1-31)
- user_id (Foreign Key -> users.id)

3. tags
Manages the labels used for filtering and allocation charts.

- id (Primary Key)
- name (Text: "#Health", "#Potions", "#Gear")
- icon_slug (Text: identifier for the Minecraft-style icon)
- user_id (Foreign Key -> users.id)

4. transaction_tags
A mapping table to allow multiple tags per transaction

- transaction_id (Foreign Key -> transactions.id)
- tag_id (Foreign Key -> tags.id)

5. users

- id (Primary Key)
- name (Text)
- email (Text)
- password (Text)

