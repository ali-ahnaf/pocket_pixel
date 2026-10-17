export interface CreateAdventureInput {
  name: string;
  flavorText?: string | null;
  fund?: number | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateAdventureInput {
  name?: string;
  flavorText?: string | null;
  fund?: number | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface AdventureDto {
  id: string;
  userId: string;
  name: string;
  flavorText: string | null;
  fund: number | null;
  startDate: string | null;
  endDate: string | null;
  /** Set only when completed by hand. */
  completedAt: string | null;
  /** completedAt is set, or endDate is before today. */
  isComplete: boolean;
  plannedTotal: number;
  spent: number;
  itemCount: number;
  boughtCount: number;
}

export interface CreateAdventureItemInput {
  name: string;
  plannedCost: number;
}

export interface UpdateAdventureItemInput {
  name?: string;
  plannedCost?: number;
  isBought?: boolean;
  actualCost?: number | null;
}

export interface AdventureItemDto {
  id: string;
  adventureId: string;
  name: string;
  plannedCost: number;
  actualCost: number | null;
  isBought: boolean;
  sortOrder: number;
}
