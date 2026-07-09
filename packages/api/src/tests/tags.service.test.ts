import type { CreateTagInput, UpdateTagInput } from '@expense-tracker/shared';
import { AppError } from '../errors/app-error';
import type { Tag } from '../entities/Tag.entity';
import type { TagsRepository } from '../repositories/tags.repository';
import { TagsService } from '../services/tags.service';

jest.mock('../services', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

type TagsRepositoryMock = jest.Mocked<
  Pick<
    TagsRepository,
    | 'findManyForUser'
    | 'countForUser'
    | 'findOneForUser'
    | 'createEntity'
    | 'save'
    | 'remove'
  >
>;

const buildTag = (overrides: Partial<Tag> = {}): Tag =>
  ({
    id: 'tag-1',
    userId: 'user-1',
    name: 'Food',
    icon: 'utensils',
    backgroundColor: '#ff0000',
    ...overrides,
  }) as Tag;

describe('TagsService', () => {
  let tags: TagsRepositoryMock;
  let service: TagsService;

  beforeEach(() => {
    tags = {
      findManyForUser: jest.fn(),
      countForUser: jest.fn(),
      findOneForUser: jest.fn(),
      createEntity: jest.fn((data) => data as Tag),
      save: jest.fn(),
      remove: jest.fn(),
    } as unknown as TagsRepositoryMock;

    service = new TagsService(tags as unknown as TagsRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('list', () => {
    it('returns all tags belonging to the user', async () => {
      const userTags = [
        buildTag(),
        buildTag({
          id: 'tag-2',
          name: 'Transport',
          icon: 'car',
          backgroundColor: '#00ff00',
        }),
      ];

      tags.findManyForUser.mockResolvedValue(userTags);

      const result = await service.list('user-1');

      expect(tags.findManyForUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(userTags);
    });

    it('returns an empty array when the user has no tags', async () => {
      tags.findManyForUser.mockResolvedValue([]);

      const result = await service.list('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('listCached', () => {
    it('loads tags from the repository when cache is empty', async () => {
      const userTags = [buildTag()];

      tags.findManyForUser.mockResolvedValue(userTags);

      const result = await service.listCached('user-1');

      expect(result).toEqual(userTags);
      expect(tags.findManyForUser).toHaveBeenCalledTimes(1);
    });

    it('returns cached tags while cache is fresh', async () => {
      const cachedTags = [buildTag()];

      let now = 1000;

      jest.spyOn(Date, 'now').mockImplementation(() => now);

      tags.findManyForUser.mockResolvedValue(cachedTags);

      const firstResult = await service.listCached('user-1');

      now += 60_000;

      const secondResult = await service.listCached('user-1');

      expect(firstResult).toEqual(cachedTags);
      expect(secondResult).toEqual(cachedTags);
      expect(tags.findManyForUser).toHaveBeenCalledTimes(1);
    });

    it('reloads tags after cache expires', async () => {
      const oldTags = [buildTag({ name: 'Old Tag' })];

      const newTags = [
        buildTag({
          id: 'tag-2',
          name: 'New Tag',
        }),
      ];

      let now = 1000;

      jest.spyOn(Date, 'now').mockImplementation(() => now);

      tags.findManyForUser
        .mockResolvedValueOnce(oldTags)
        .mockResolvedValueOnce(newTags);

      const firstResult = await service.listCached('user-1');

      now += 5 * 60 * 1000;

      const secondResult = await service.listCached('user-1');

      expect(firstResult).toEqual(oldTags);
      expect(secondResult).toEqual(newTags);
      expect(tags.findManyForUser).toHaveBeenCalledTimes(2);
    });

    it('reloads tags after invalidateCache is called', async () => {
      const originalTags = [buildTag({ name: 'Original' })];
      const updatedTags = [buildTag({ name: 'Updated' })];

      tags.findManyForUser
        .mockResolvedValueOnce(originalTags)
        .mockResolvedValueOnce(updatedTags);

      const firstResult = await service.listCached('user-1');

      service.invalidateCache('user-1');

      const secondResult = await service.listCached('user-1');

      expect(firstResult).toEqual(originalTags);
      expect(secondResult).toEqual(updatedTags);
      expect(tags.findManyForUser).toHaveBeenCalledTimes(2);
    });
  });

  describe('invalidateCache', () => {
    it('clears only the specified user cache', async () => {
      const userOneTags = [buildTag()];

      const userTwoTags = [
        buildTag({
          id: 'tag-2',
          userId: 'user-2',
          name: 'Travel',
        }),
      ];

      tags.findManyForUser.mockImplementation(async (userId) =>
        userId === 'user-1' ? userOneTags : userTwoTags,
      );

      await service.listCached('user-1');
      await service.listCached('user-2');

      tags.findManyForUser.mockClear();

      service.invalidateCache('user-1');

      await service.listCached('user-1');
      await service.listCached('user-2');

      expect(tags.findManyForUser).toHaveBeenCalledTimes(1);
      expect(tags.findManyForUser).toHaveBeenCalledWith('user-1');
    });

    it('does not throw when user has no cached data', () => {
      expect(() =>
        service.invalidateCache('missing-user'),
      ).not.toThrow();
    });
  });

  describe('ensureUserTagsExist', () => {
    it('returns true for empty tag list without repository query', async () => {
      const result = await service.ensureUserTagsExist(
        'user-1',
        [],
      );

      expect(result).toBe(true);
      expect(tags.countForUser).not.toHaveBeenCalled();
    });

    it('returns true when all tags belong to the user', async () => {
      tags.countForUser.mockResolvedValue(3);

      const result = await service.ensureUserTagsExist(
        'user-1',
        ['tag-1', 'tag-2', 'tag-3'],
      );

      expect(result).toBe(true);

      expect(tags.countForUser).toHaveBeenCalledWith(
        'user-1',
        ['tag-1', 'tag-2', 'tag-3'],
      );
    });

    it('returns false when some tags do not belong to the user', async () => {
      tags.countForUser.mockResolvedValue(2);

      const result = await service.ensureUserTagsExist(
        'user-1',
        ['tag-1', 'tag-2', 'tag-3'],
      );

      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    it('creates and saves only expected fields', async () => {
      const input = {
        name: 'Food',
        icon: 'utensils',
        backgroundColor: '#ff0000',
        unexpectedField: 'should-not-be-saved',
      } as unknown as CreateTagInput;

      const savedTag = buildTag();

      tags.createEntity.mockImplementation(
        (data) =>
          ({
            id: 'tag-1',
            ...data,
          }) as Tag,
      );

      tags.save.mockResolvedValue(savedTag);

      const result = await service.create('user-1', input);

      expect(tags.createEntity).toHaveBeenCalledWith({
        userId: 'user-1',
        name: 'Food',
        icon: 'utensils',
        backgroundColor: '#ff0000',
      });

      const createData = tags.createEntity.mock.calls[0][0];

      expect(createData).not.toHaveProperty(
        'unexpectedField',
      );

      expect(tags.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(savedTag);
    });

    it('defaults optional fields to null', async () => {
      const input = {
        name: 'Miscellaneous',
      } as CreateTagInput;

      tags.save.mockResolvedValue(
        buildTag({
          name: 'Miscellaneous',
          icon: null,
          backgroundColor: null,
        }),
      );

      await service.create('user-1', input);

      expect(tags.createEntity).toHaveBeenCalledWith({
        userId: 'user-1',
        name: 'Miscellaneous',
        icon: null,
        backgroundColor: null,
      });
    });
  });

  describe('update', () => {
    it('updates and saves expected fields', async () => {
      const existingTag = buildTag({
        name: 'Old Name',
        icon: 'old-icon',
        backgroundColor: '#111111',
      });

      const input = {
        name: 'New Name',
        icon: 'new-icon',
        backgroundColor: '#222222',
        unexpectedField: 'should-not-be-saved',
      } as unknown as UpdateTagInput;

      tags.findOneForUser.mockResolvedValue(existingTag);

      tags.save.mockImplementation(async (tag) => tag);

      const result = await service.update(
        'user-1',
        'tag-1',
        input,
      );

      expect(tags.findOneForUser).toHaveBeenCalledWith(
        'user-1',
        'tag-1',
      );

      expect(result).toMatchObject({
        name: 'New Name',
        icon: 'new-icon',
        backgroundColor: '#222222',
      });

      expect(
        tags.save.mock.calls[0][0],
      ).not.toHaveProperty('unexpectedField');
    });

    it('keeps existing fields when omitted from update', async () => {
      const existingTag = buildTag({
        name: 'Food',
        icon: 'utensils',
        backgroundColor: '#ff0000',
      });

      tags.findOneForUser.mockResolvedValue(existingTag);
      tags.save.mockImplementation(async (tag) => tag);

      const result = await service.update(
        'user-1',
        'tag-1',
        {
          name: 'Dining',
        },
      );

      expect(result).toMatchObject({
        name: 'Dining',
        icon: 'utensils',
        backgroundColor: '#ff0000',
      });
    });

    it('throws 404 AppError when tag does not exist', async () => {
      tags.findOneForUser.mockResolvedValue(null);

      await expect(
        service.update(
          'user-1',
          'missing-tag',
          { name: 'Updated' },
        ),
      ).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 404,
        message: 'Tag not found',
      });

      expect(tags.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('removes an existing tag', async () => {
      const existingTag = buildTag();

      tags.findOneForUser.mockResolvedValue(existingTag);
     tags.remove.mockResolvedValue(existingTag);

      await service.remove('user-1', 'tag-1');

      expect(tags.findOneForUser).toHaveBeenCalledWith(
        'user-1',
        'tag-1',
      );

      expect(tags.remove).toHaveBeenCalledWith(
        existingTag,
      );

      expect(tags.remove).toHaveBeenCalledTimes(1);
    });

    it('throws 404 AppError when tag does not exist', async () => {
      tags.findOneForUser.mockResolvedValue(null);

      await expect(
        service.remove('user-1', 'missing-tag'),
      ).rejects.toMatchObject({
        constructor: AppError,
        statusCode: 404,
        message: 'Tag not found',
      });

      expect(tags.remove).not.toHaveBeenCalled();
    });
  });
});