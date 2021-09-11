import fs from 'fs';
import prettyBytes from 'pretty-bytes';

class FileHelper {
  static async getFilesStatus(downloadsFolder: string) {
    const currentFiles = await fs.promises.readdir(downloadsFolder);

    const statuses = await Promise.all(currentFiles.map((file) => fs.promises.stat(`${downloadsFolder}/${file}`)));

    return currentFiles.map((file, idx) => {
      const { birthtime, size } = statuses[idx];
      return {
        size: prettyBytes(size),
        file: file,
        lastModified: birthtime,
        owner: process.env.USER,
      };
    });
  }
}

export default FileHelper;
