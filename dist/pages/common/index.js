
var $ = require('../../base/cool');

Page($({
  data: {
    slideHeight: 0,
  },
  onLoad: function (options) {
    if ($.config.debug && !$.config.debugRedirect) {
      $.config.debugRedirect = true;
      wx.redirectTo({
        url: '/pages/dev/index',
      });
      return;
    }
  }
}))
