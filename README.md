the app will be used to track my expenses. There should be a profile page. In that page, i can add a recurring expense or income with a tag. The recurrence interval should be monthly or weekly.

Then in the home page, i have option to choose month (by default it should select the current month) and year but i should have the option to choose any future or past months. 

In each month, i can add expenses or additional income where i can add the value and an optional tag and select whether its an expense or income (default = expense). and also choose the vaul. 

The app should also have a page to view my analytics based on tags, monthly or yearly.


Make all these context into a query i can give to claude code to design the app in a modern futuristic cyberpunk theme.





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

