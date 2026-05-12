import { AppDataSource } from "../../data-source";
import { Vault } from "../../entities/Vault.entity";

export const vaultsRepo = () => AppDataSource.getRepository(Vault);
