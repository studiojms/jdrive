class ViewManager {
  constructor() {
    this.tbody = document.getElementById('tbody');
    this.btnNewFile = document.getElementById('btnNewFile');
    this.fileElem = document.getElementById('fileElem');

    this.formatter = new Intl.DateTimeFormat('pt', {
      locale: 'pt-br',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  configureBtnNewFileClick() {
    this.btnNewFile.onclick = () => this.fileElem.click();
  }

  getIcon(file) {
    let icon = 'content_copy';

    if (file.match(/\.mp4|\.mkv|\.avi/i)) {
      icon = 'movie';
    } else if (file.match(/\.jp|\.png|\.webp|\.bmp/i)) {
      icon = 'image';
    }

    return icon;
  }

  makeIcon(file) {
    const icon = this.getIcon(file);
    const colors = {
      image: 'yellow600',
      movie: 'red600',
      file: '',
    };

    return `<i class="material-icons ${colors[icon]} left">${icon}</i>`;
  }

  updateCurrentFiles(files) {
    const template = (item) => `<tr>
        <td>${this.makeIcon(item.file)} ${item.file}</td>
        <td>${item.owner}</td>
        <td>${this.formatter.format(new Date(item.lastModified))}</td>
        <td>${item.size}</td>
    </tr>`;

    this.tbody.innerHTML = files.map(template).join('');
  }
}

export default ViewManager;
