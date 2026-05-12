import { AppDataSource } from "../../data-source";
import { Tag } from "../../entities/Tag.entity";

export const tagsRepo = () => AppDataSource.getRepository(Tag);
