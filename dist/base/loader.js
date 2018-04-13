var util = require('util');

function Loader(url, page) {
  this.url = url;
  this.next = '';
  this.items = [];
  this.page = page;
  this.loading = false;
}

Loader.prototype.load = function () {
  if (this.loading) return;

  this.loading = true;
  util.get({
    url: this.url,
    success: function (res) {
      this.items = res.data.items;
      this.next = res.data.next;
      this.page.setData(res.data);
      this.loading = false;
      wx.stopPullDownRefresh();
      if (this.page.onLoadSuccess) {
        this.page.onLoadSuccess(res);
      }
    }.bind(this),
    fail: function (res) {
      this.loading = false;
      wx.stopPullDownRefresh();
    }.bind(this)
  })
}

Loader.prototype.loadNext = function () {
  if (this.loading || !this.next) return;

  this.loading = true;
  util.get({
    url: this.next,
    success: function (res) {
      this.items = this.items.concat(res.data.items);
      this.next = res.data.next;
      this.page.setData({ items: this.items, next: this.next });
      this.loading = false;
    }.bind(this),
    fail: function (res) {
      this.loading = false;
    }.bind(this)
  })
}

module.exports = Loader;
