const crypto = require('crypto');

class ToDo {
  constructor(text) {
    this.text = text;
    this.completed = false;
    this.etag = crypto.createHash('sha1').update(this.text);
    this.digest = this.etag.digest('hex');
  }

  updateHash() {
    this.etag = crypto.createHash('sha1').update(this.text);
    this.digest = this.etag.digest('hex');
  }

  toggleComplete() {
    this.completed = !this.completed;
  }
}

module.exports = Object.freeze({
  ToDo,
});