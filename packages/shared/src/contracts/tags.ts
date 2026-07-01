export interface CreateTagInput {
  name: string;
  icon?: string | null;
  backgroundColor?: string | null;
}

export interface UpdateTagInput {
  name?: string;
  icon?: string | null;
  backgroundColor?: string | null;
}

export interface TagDto {
  id: string;
  userId: string;
  name: string;
  icon: string | null;
  backgroundColor: string | null;
}
