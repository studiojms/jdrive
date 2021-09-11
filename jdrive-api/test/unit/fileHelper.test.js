import { describe, expect, jest } from '@jest/globals';
import fs from 'fs';
import FileHelper from '../../src/fileHelper';

describe('FileHelper', () => {
  describe('getFilesStatus', () => {
    it('should return files statuses in correct format', async () => {
      const statMock = {
        dev: 66307,
        mode: 33204,
        nlink: 1,
        uid: 1001,
        gid: 1001,
        rdev: 0,
        blksize: 4096,
        ino: 1302284,
        size: 78902,
        blocks: 160,
        atimeMs: 1631021869002.814,
        mtimeMs: 1630946061000,
        ctimeMs: 1630959662384.1501,
        birthtimeMs: 1630959662380.1501,
        atime: '2021-09-07T13:37:49.003Z',
        mtime: '2021-09-06T16:34:21.000Z',
        ctime: '2021-09-06T20:21:02.384Z',
        birthtime: '2021-09-06T20:21:02.380Z',
      };
      const mockUser = 'john.doe';
      process.env.USER = mockUser;
      const fileName = 'image.png';

      jest.spyOn(fs.promises, fs.promises.readdir.name).mockResolvedValue([fileName]);
      jest.spyOn(fs.promises, fs.promises.stat.name).mockResolvedValue(statMock);

      const result = await FileHelper.getFilesStatus('/tmp');

      const expectedResult = [
        {
          size: '78.9 kB',
          lastModified: statMock.birthtime,
          owner: mockUser,
          file: fileName,
        },
      ];

      expect(fs.promises.stat).toHaveBeenLastCalledWith(`/tmp/${fileName}`);
      expect(result).toMatchObject(expectedResult);
    });
  });
});
