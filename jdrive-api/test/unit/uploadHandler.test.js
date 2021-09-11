import { describe, expect, jest } from '@jest/globals';
import UploadHandler from '../../src/uploadHandler';
import TestUtil from '../util/testUtil';

describe('UploadHandler', () => {
  const ioObj = {
    to: (id) => ioObj,
    emit: (event, msg) => {},
  };

  describe('registerEvents', () => {
    it('should call onFile and onFinish functions', () => {
      const socketId = '01';
      const uploadHandler = new UploadHandler(ioObj, socketId);

      jest.spyOn(uploadHandler, uploadHandler.onFile.name).mockResolvedValue();

      const headers = {
        'content-type': 'multipart/form-data; boundary=',
      };

      const onFinish = jest.fn();
      const busboyInstance = uploadHandler.registerEvents(headers, onFinish);

      const fileStream = TestUtil.generateReadableStream(['chunk', 'of', 'data']);
      busboyInstance.emit('file', 'fieldName', fileStream, 'file.txt');
      busboyInstance.listeners('finish')[0].call();

      fileStream.on('data', (msg) => console.log('msg', msg.toString()));

      expect(uploadHandler.onFile).toHaveBeenCalled();
      expect(onFinish).toHaveBeenCalled();
    });
  });

  //TODO continue: https://youtu.be/EwJqK3Q6tTo?t=2274
});
