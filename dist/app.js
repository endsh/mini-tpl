//app.js
var $ = require('base/cool');

App({
  data: {
    screenWidth: 750,
    error:'none',
  },
  onLaunch: function () {
    wx.getSystemInfo({
      success: function (res) {
        this.data.screenWidth = res.windowWidth
      }.bind(this)
    })
    $.user.login();
  },
  getCool: function () {
    return $;
  }
})