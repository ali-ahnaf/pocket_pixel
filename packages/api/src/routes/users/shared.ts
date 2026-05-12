import { AppDataSource } from "../../data-source";
import { User } from "../../entities/User.entity";

export const usersRepo = () => AppDataSource.getRepository(User);
