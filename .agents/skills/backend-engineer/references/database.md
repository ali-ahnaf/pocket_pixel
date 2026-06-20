## Database Changes

When the task changes persistence or database fields:

1. Database entities are saved in `api/src/entities`.
2. All entities must extend BaseEntity.
3. Entities should be named as `<Feature>Entity`, ie UserEntity. But the database name should be "users".
4. When declaring new enums, make sure to put them in the `shared` workspace in the folder called "constants" in a new file in the format `<feature>.constant.ts`. 

If the change affects shared contracts, update `shared` workspace first and consume that type from `api`.
