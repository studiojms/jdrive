import { describe, expect, jest, beforeEach } from '@jest/globals';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { logger } from '../../src/logger';

import UploadHandler from '../../src/uploadHandler';
import TestUtil from '../util/testUtil';

describe('UploadHandler', () => {
  const ioObj = {
    to: (id) => ioObj,
    emit: (event, msg) => {},
  };

  beforeEach(() => {
    jest.spyOn(logger, 'info').mockImplementation();
  });

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

      fileStream.on('data', (msg) => msg.toString());

      expect(uploadHandler.onFile).toHaveBeenCalled();
      expect(onFinish).toHaveBeenCalled();
    });
  });

  describe('onFile', () => {
    it('should save a file on disk when received from stream', async () => {
      const socketId = '01';
      const downloadsFolder = '/tmp';
      const chunks = ['part', 'of', 'the', 'file'];

      const handler = new UploadHandler(ioObj, socketId, downloadsFolder);

      const onData = jest.fn();
      const onTransform = jest.fn();

      jest.spyOn(fs, fs.createWriteStream.name).mockImplementation(() => TestUtil.generateWritableStream(onData));

      jest
        .spyOn(handler, handler.handleFileBuffer.name)
        .mockImplementation(() => TestUtil.generateTransformStream(onTransform));

      const reqParams = {
        fieldname: 'video',
        file: TestUtil.generateReadableStream(chunks),
        fileName: 'mockFile.mkv',
      };

      await handler.onFile(...Object.values(reqParams));

      expect(onData.mock.calls.join()).toEqual(chunks.join());
      expect(onTransform.mock.calls.join()).toEqual(chunks.join());

      const expectedFileName = `${handler.downloadsFolder}/${reqParams.fileName}`;

      expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFileName);
    });
  });

  describe('handleFileBuffer', () => {
    it('should call emit function (and it is a transform stream)', async () => {
      const socketId = '01';

      jest.spyOn(ioObj, ioObj.to.name);
      jest.spyOn(ioObj, ioObj.emit.name);

      const handler = new UploadHandler(ioObj, socketId);
      jest.spyOn(handler, handler.canExecute.name).mockReturnValue(true);

      const messages = ['hello world'];
      const source = TestUtil.generateReadableStream(messages);
      const onWrite = jest.fn();
      const target = TestUtil.generateWritableStream(onWrite);

      await pipeline(source, handler.handleFileBuffer('file.txt'), target);

      expect(ioObj.to).toHaveBeenCalledTimes(messages.length);
      expect(ioObj.emit).toHaveBeenCalledTimes(messages.length);

      expect(onWrite).toBeCalledTimes(messages.length);
      expect(onWrite.mock.calls.join()).toEqual(messages.join());
    });

    it('backpressure - should emit only two messages during 3 seconds period given timerDelay defined as 2s', async () => {
      jest.spyOn(ioObj, ioObj.emit.name);

      const day = '2021-12-01 01:00';
      const initVariableTime = TestUtil.getTimeFromDate(`${day}:00`);
      const firstExecutionTime = TestUtil.getTimeFromDate(`${day}:02`);

      const secondUploadeLastMessageSent = firstExecutionTime;

      const secondExecutionTime = TestUtil.getTimeFromDate(`${day}:03`);
      const thirdExecutionTime = TestUtil.getTimeFromDate(`${day}:05`);

      TestUtil.mockCurrentDate([
        initVariableTime,
        firstExecutionTime,
        secondUploadeLastMessageSent,
        secondExecutionTime,
        thirdExecutionTime,
      ]);

      const socketId = '01';
      const timerDelay = 2000;

      const messages = ['first message', 'second message', 'third message'];
      const fileName = 'file.txt';

      const expectedSentMessages = 2;

      const source = TestUtil.generateReadableStream(messages);
      const handler = new UploadHandler(ioObj, socketId, null, timerDelay);

      await pipeline(source, handler.handleFileBuffer(fileName));

      expect(ioObj.emit).toHaveBeenCalledTimes(expectedSentMessages);

      const [firstCallResult, secondCallResult] = ioObj.emit.mock.calls;
      expect(firstCallResult).toEqual([handler.ON_UPLOAD_EVENT, { alreadyProcessed: messages[0].length, fileName }]);
      expect(secondCallResult).toEqual([
        handler.ON_UPLOAD_EVENT,
        { alreadyProcessed: messages.join('').length, fileName },
      ]);
    });
  });

  describe('canExecute', () => {
    it('should return true when time is later than specified delay', () => {
      const timerDelay = 1000;
      const uploadHandler = new UploadHandler({}, '', '', timerDelay);
      const nowTick = TestUtil.getTimeFromDate('2021-12-12 00:00:03');

      TestUtil.mockCurrentDate([nowTick]);

      const threeSecsBeforeTick = TestUtil.getTimeFromDate('2021-12-12 00:00:00');

      const lastExec = threeSecsBeforeTick;

      const result = uploadHandler.canExecute(lastExec);

      expect(result).toBeTruthy();
    });

    it('should return false when time is not later than specified delay', () => {
      const timerDelay = 2000;
      const uploadHandler = new UploadHandler({}, '', '', timerDelay);
      const nowTick = TestUtil.getTimeFromDate('2021-12-12 00:00:02');

      TestUtil.mockCurrentDate([nowTick]);

      const threeSecsBeforeTick = TestUtil.getTimeFromDate('2021-12-12 00:00:01');

      const lastExec = threeSecsBeforeTick;

      const result = uploadHandler.canExecute(lastExec);

      expect(result).toBeFalsy();
    });
  });
});
