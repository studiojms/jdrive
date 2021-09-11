import { jest } from '@jest/globals';
import { Readable, Transform, Writable } from 'stream';

class TestUtil {
  static generateReadableStream(data) {
    return new Readable({
      objectMode: true,
      read() {
        for (const item of data) {
          this.push(item);
        }
        this.push(null);
      },
    });
  }

  static generateTransformStream(onData) {
    return new Transform({
      objectMode: true,
      transform(chunk, enconding, cb) {
        if (onData) {
          onData(chunk);
        }

        cb(null, chunk);
      },
    });
  }

  static generateWritableStream(onData) {
    return new Writable({
      objectMode: true,
      write(chunk, encoding, cb) {
        if (onData) {
          onData(chunk);
        }

        cb(null, chunk);
      },
    });
  }

  static getTimeFromDate(strDate) {
    return new Date(strDate).getTime();
  }

  static mockCurrentDate(mockImplementationPeriods) {
    const now = jest.spyOn(global.Date, global.Date.now.name);

    mockImplementationPeriods.forEach((time) => {
      now.mockReturnValueOnce(time);
    });
  }
}

export default TestUtil;
