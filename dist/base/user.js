var util = require('util');

module.exports = {
  KEY: 'user',
  URL: '/oauth/mini/default/jscode?token=true',
  isCheckSession: false,
  isLoading: false,
  isLogining: false,
  getStatus: function() {
    if (this.isLogin()) {
      return 'success';
    } else if (this.isCheckSession || this.isLoading || this.isLogining) {
      return 'logining';
    } else {
      return 'fail';
    }
  },
  isLogin: function() {
    return this.data && this.data.token;
  },
  login: function() {
    this.data = null;
    this.isCheckSession = true;
    wx.checkSession({
      success: function() {
        this.load();
        this.isCheckSession = false;
      }.bind(this),
      fail: function() {
        this.doLogin();
        this.isCheckSession = false;
      }.bind(this)
    });
  },
  doLogin: function() {
    if (this.isLogining) {
      return;
    }

    this.isLogining = true;
    this.data = null;
    wx.login({
      success: function(res) {
        if (res.code) {
          util.post({
            url: this.URL,
            data: { code: res.code },
            success: function(res) {
              this.save(res.data);
              this.checkLogin();
            }.bind(this),
            fail: this.onLoginFail.bind(this),
          })
        } else {
          this.onLoginFail(res);
        }
      }.bind(this),
      fail: this.onLoginFail.bind(this),
    });
  },
  onLoginSuccess: function() {
    this.isLogining = false;
    if (wx.getStorageSync('inviter')) {
      this.postBindRelation(wx.getStorageSync('inviter'))
    }
    if (getApp().getCurrentPages) {
      for (var page of getApp().getCurrentPages()) {
        if (page.onLoginSuccess) {
          page.onLoginSuccess();
        }
      }
    }
  },
  onLoginFail: function(res) {
    this.isLogining = false;
    if (getApp().getCurrentPages) {
      for (var page of getApp().getCurrentPages()) {
        if (page.onLoginFail) {
          page.onLoginFail(res);
        }
      }
    }
  },
  onGetUserInfoSuccess: function() {
    if (getApp().getCurrentPages) {
      for (var page of getApp().getCurrentPages()) {
        if (page.onGetUserInfoSuccess) {
          page.onGetUserInfoSuccess();
        }
      }
    }
  },
  onGetUserInfoFail: function(res) {
    if (getApp().getCurrentPages) {
      for (var page of getApp().getCurrentPages()) {
        if (page.onGetUserInfoFail) {
          page.onGetUserInfoFail(res);
        }
      }
    }
  },
  load: function() {
    this.data = null;
    this.isLoading = true;
    wx.getStorage({
      key: this.KEY,
      success: function(res) {
        this.data = res.data;
        var last = this.data.last;
        if (!last || Date.parse(new Date()) - last > 86400) {
          this.doLogin();
        } else {
          this.checkLogin();
        }
        this.isLoading = false;
      }.bind(this),
      fail: function() {
        this.doLogin();
        this.isLoading = false;
      }.bind(this)
    });
  },
  save: function(data) {
    this.data = data;
    this.data.last = Date.parse(new Date());
    wx.setStorage({
      key: this.KEY,
      data: this.data,
    });
  },
  checkLogin: function() {
    if (this.isLogin()) {
      this.onLoginSuccess();
      this.checkUserInfo();
    } else {
      this.doLogin();
    }
  },
  checkUserInfo: function() {
    if (!this.data.nickname || !this.data.avatar) {
      this.updateUserInfo();
    } else {
      this.onGetUserInfoSuccess();
    }
  },
  updateUserInfo: function() {
    wx.getUserInfo({
      withCredentials: true,
      success: function(res) {
        util.post({
          url: this.URL,
          data: res,
          success: function(res) {
            this.save(res.data);
            if (this.data.nickname && this.data.avatar) {
              this.onGetUserInfoSuccess();
            } else {
              this.onGetUserInfoFail(res);
            }
          }.bind(this),
          fail: this.onGetUserInfoFail.bind(this),
        })
      }.bind(this),
      fail: this.onGetUserInfoFail.bind(this),
    })
  },
  getToken: function() {
    if (this.isLogin()) {
      return this.data.token;
    }
    return "";
  },
  postBindRelation: function(inviter) {
    if (this.isLogin()) {
      util.post({
        url: '/u/' + inviter + '/bind/',
        success: function(res) {
          wx.setStorageSync('inviter', '')
        }.bind(this),
        fail: function(res) {}.bind(this)
      })
    } else {
      wx.setStorageSync('inviter', inviter)
    }
  }
}