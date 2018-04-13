var config = require('config');
var chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

module.exports = {
  callbacks: {},
  getResult: function(url, ssid, callback) {
    if (url.indexOf('?') === -1) {
      url += '?' + 'ssid=' + ssid;
    } else {
      url += '&ssid=' + ssid;
    }

    wx.navigateTo({ url });
    this.callbacks[ssid] = { callback };
  },
  setResult: function(ssid, res) {
    if (!this.callbacks[ssid]) {
      this.callbacks[ssid] = {}
    }
    this.callbacks[ssid].result = res;
  },
  onResult: function(ssid) {
    if (this.callbacks[ssid]) {
      var obj = this.callbacks[ssid];
      obj.callback(obj.result);
      delete this.callbacks[ssid];
    }
  },
  formatURL: function(url) {
    if (url && url.startsWith('/')) {
      return 'https://' + config.host + url;
    }
    return url;
  },
  request: function(obj) {
    var success = obj.success,
      fail = obj.fail;
    obj.url = this.formatURL(obj.url);
    if (!obj.header) {
      obj.header = {}
    }
    obj.header.Authorization = getApp().getCool().user.getToken();
    // if (!obj.header['Content-Type']) {
    //   obj.header['Content-Type'] = "application/x-www-form-urlencoded";
    // }

    obj.success = function(res) {
      if (res.data.key === 'LOGIN_REQUIRED') {
        console.debug('login required:', obj.url, obj, res);
        getApp().getCool().user.doLogin();
      } else if (res.data.code === 0) {
        console.debug('success:', obj.url, obj, res);
        if (success) {
          success(res.data);
        }
      } else if (fail) {
        console.debug('fail:', obj.url, obj, res);
        fail(res.data);
      }
    };
    obj.fail = function(res) {
      console.debug('error:', obj.url, obj, res);
      if (fail) {
        fail(res);
      }
    };
    return wx.request(obj);
  },
  get: function(obj) {
    obj.method = 'GET';
    return this.request(obj);
  },
  post: function(obj) {
    obj.method = 'POST';
    return this.request(obj);
  },
  put: function(obj) {
    obj.method = 'PUT';
    return this.request(obj);
  },
  del: function(obj) {
    obj.method = 'DELETE';
    return this.request(obj);
  },
  trace: function(obj) {
    $.post({
      url: '/trace/log',
      data: obj
    })
  },
  rmb: function(price) {
    var price = (price / 100.0).toFixed(2) + "";
    while (price[price.length - 1] === '0') {
      price = price.substring(0, price.length - 1);
      if (price[price.length - 1] === '.') {
        price = price.substring(0, price.length - 1);
        break;
      }
    }
    return price;
  },
  randomText: function(n) {
    var res = "";
    for (var i = 0; i < n; i++) {
      var id = Math.ceil(Math.random() * chars.length);
      res += chars[id];
    }
    return res;
  },
  timeout2text: function(timeout, fuck = 0) {
    var text = '00:00:00';
    if (timeout > 0) {
      var h = parseInt(timeout / 3600);
      var m = parseInt(timeout % 3600 / 60);
      var s = parseInt(timeout % 60);
      var ms = parseInt((timeout - parseInt(timeout)) * 10);
      text = (h < 10 ? '0' + h : h) + ":" + (m < 10 ? '0' + m : m) + ":" + (s < 10 ? '0' + s : s) + '.' + ms;
    }
    if (fuck == true) {
      return {
        h: h < 10 ? '0' + h : h,
        m: m < 10 ? '0' + m : m,
        s: s < 10 ? '0' + s : s,
        ms: ms < 10 ? '0' + ms : ms
      }
    } else {
      return text;
    }
  },
  getCurrentPageUrl: function() {
    var pages = getCurrentPages()
    var currentPage = pages[pages.length - 1]
    var url = currentPage.route
    return url
  },
  getCurrentPageUrlWithArgs: function() {
    var pages = getCurrentPages()
    var currentPage = pages[pages.length - 1]
    var url = currentPage.route
    var options = currentPage.options
    var urlWithArgs = url + '?'
    for (var key in options) {
      var value = options[key]
      urlWithArgs += key + '=' + value + '&'
    }
    urlWithArgs = urlWithArgs.substring(0, urlWithArgs.length - 1)
    return urlWithArgs
  },
}