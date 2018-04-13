var util = require('util');
var config = require('config');
var user = require('user');
var Toast = require('toast/index');
var ImageLoader = require('img-loader/img-loader');
var md5 = require('md5');

function clone(exports, obj) {
  for (var attr in obj) {
    exports[attr] = obj[attr];
  }
}

var Loader = {
  load: function(url) {
    if (url) {
      this.setDataWrapper({ url });
    }
    this.reload('loading');
  },
  reload: function(load = 'reloading') {
    var data = this.getDataWrapper();
    if (data.load == 'loading' || data.load == 'reloading') return;

    this.setDataWrapper({ load });
    this.doLoad();
  },
  doLoad: function() {
    var data = this.getDataWrapper();
    if (data.url) {
      util.get({
        url: data.url,
        success: function(res) {
          wx.stopPullDownRefresh();
          this.setDataWrapper({ ...res.data, load: 'success' });
          if (this.onLoadSuccess) {
            this.onLoadSuccess(res);
          }
        }.bind(this),
        fail: function(res) {
          wx.stopPullDownRefresh();
          this.setDataWrapper({ load: 'fail' });
          this.onLoadFailWrapper(res);
        }.bind(this)
      })
    } else {
      this.setDataWrapper({ load: 'success' })
    }
  },
  loadNext: function() {
    var data = this.getDataWrapper();
    if (data.load == 'loading' || data.loadNext == 'loading' || !data.next) return;

    this.setDataWrapper({ loadNext: 'loading' });
    util.get({
      url: data.next,
      success: function(res) {
        var data = this.getDataWrapper();
        data.next = res.data.next;
        data.items = data.items.concat(res.data.items);
        this.setDataWrapper({
          items: data.items,
          next: data.next,
          loadNext: 'wait'
        });
        if (this.onLoadNextSuccess) {
          this.onLoadNextSuccess(res);
        }
      }.bind(this),
      fail: function(res) {
        this.setDataWrapper({ loadNext: 'fail' });
        this.onLoadFailWrapper(res);
      }.bind(this)
    })
  },
  getDataWrapper: function() {
    return this.data;
  },
  setDataWrapper: function(data) {
    return this.setData(data);
  },
  onLoadFailWrapper: function(data) {
    wx.getNetworkType({
      success: function(res) {
        var err = res.networkType == 'none' ? 'network' : 'unknown';
        this.setDataWrapper({ error: err });
      }.bind(this)
    })
    if (this.onLoadFail) {
      this.onLoadFail(data);
    }
  }
}

var Base = {
  initLoaders: function(obj) {
    this.loaders = [];
    for (var index in obj.items) {
      this.loaders.push(Object.assign({}, Loader, {
        _index: index,
        getDataWrapper: function() {
          return obj.getData(this._index)
        },
        setDataWrapper: function(data) {
          return obj.setData(this._index, data);
        },
        onLoadSuccess: function(data) {
          if (obj.onLoadSuccess) {
            return obj.onLoadSuccess(this._index, data);
          }
        },
        onLoadNextSuccess: function(data) {
          if (obj.onLoadNextSuccess) {
            return obj.onLoadNextSuccess(this._index, data);
          }
        },
        onLoadFail: function(data) {
          if (obj.onLoadSuccess) {
            return obj.onLoadFail(this._index, data);
          }
        }
      }));
    }
  },
  onReloadDest:function(reloadList){
    var pages = getCurrentPages();
    for (var page of pages) {
      for(var wreload of reloadList){
        if (wreload.route == page.route) {
          if (page.route == 'pages/orders/index') {
            page.reloadTab(wreload.id);
          } else {
            page.reload();
          }
          // break;
        }
      }
      
    }
  },
  initGoodsLoader: function(obj) {
    var that = this;
    this.loader = Object.assign({}, Loader, {
      getDataWrapper: function() {
        return obj.getData()
      },
      setDataWrapper: function(data) {
        return obj.setData(data);
      },
      onLoadSuccess: function(res) {
        console.log(this); //这个this是loader的。
        this.setSuccessData(res.data.items, res);
      },
      onLoadNextSuccess: function(res) {
        this.setSuccessData(that.data.list_data.data.items, res)
      },

      setSuccessData: function(items, res) {
        console.log(this); //这个this是page的。
        this.setLazyImages(res.data.items, '/images/lazy/375.jpg', 'cover');
        this.setData({
          list_info: {
            items: items,
            empty: this.data.list_data.data.load == 'success' && res.data.items.length == 0,
            load: this.data.list_data.data.load,
            next: res.data.next,
            loadNext: this.loader.loadNext,
            itemWidth: this.data.itemWidth,
            bottom: obj.bottom,
            titleFlag: obj.titleFlag,
            titleName: obj.titleName,
            titleImage: obj.titleImage,
          }
        });
      }.bind(this),
    })
    this.loader.load();
  },
  login: function() {
    if ($.user.getStatus() == 'logining') {
      this.setData({ login: 'logining' });
      setTimeout(function() {
        this.login();
      }.bind(this), 100);
    } else if ($.user.getStatus() == 'success') {
      this.setData({ login: 'success' });
      this._onLoad();
    } else {
      wx.getNetworkType({
        success: function(res) {
          var err = res.networkType == 'none' ? 'network' : 'unknown';
          this.setData({ login: 'fail', error: err });
        }.bind(this)
      })
    }
  },
  onLoadWrapper: function(options) {
    this.data.options = options;
    this.lazyImageLoader = new ImageLoader(this, this.onLazyImageLoad.bind(this));

    if (this.data && this.data.title) {
      wx.setNavigationBarTitle({
        title: this.data.title,
      });
    }

    if (this.data.loginRequired == true) {
      this.login();
    } else {
      this._onLoad();
    }
  },
  onShowWrapper: function() {
    if (this._ssid) {
      $.onResult(this._ssid);
    }
    return this._onShow();
  },
  onLoad: function() {
    this.load();
  },
  onShow: function() {},
  onRetry: function() {
    if (this.data.loginRequired == true && $.user.getStatus() === 'fail') {
      $.user.doLogin();
      this.login();
    } else {
      this.load();
    }
  },
  onReLaunch: function() {
    wx.reLaunch();
  },
  onBackIndex: function() {
    wx.switchTab({
      url: '/pages/common/index',
    })
  },
  onPullDownRefresh: function() {
    this.reload();
  },
  onReachBottom: function(e) {
    if (this.data.loadNext != 'fail') {
      this.loadNext();
    }
  },
  getItemKey: function(item, key) {
    var res = item;
    for (var k of key.split('.')) {
      res = res[k];
    }
    return res;
  },
  setLazyImages: function(items, lazy, key = null) {
    var images = this.data.images || {};
    var keys = this.data.keys || {};
    for (var item of items) {
      var link = key === null ? item : this.getItemKey(item, key);
      if (!keys[link]) {
        keys[link] = md5(link);
        images[keys[link]] = {
          loaded: false,
          link: $.config.lazyImage ? lazy : link,
          src: link,
          lazy: lazy
        }
      }
    }
    this.setData({ images: images, keys: keys })
  },
  setLazyImage: function(link, lazy) {
    var images = this.data.images || {};
    var keys = this.data.keys || {};
    if (!keys[link]) {
      keys[link] = md5(link);
      images[keys[link]] = {
        loaded: false,
        link: $.config.lazyImage ? lazy : link,
        src: link,
        lazy: lazy,
      }
    }
    this.setData({ images: images, keys: keys })
  },
  onLazyImageLoad(err, data) {
    // setTimeout(function () {
    //   this.data.lazyImages[data.src].loaded = true;
    //   this.setData({ lazyImages: this.data.lazyImages });
    // }.bind(this), Math.random() * 10000);
    if ($.config.lazyImage) {
      var images = this.data.images;
      var key = this.data.keys[data.src];
      images[key].loaded = true;
      images[key].link = data.src;
      this.setData({
        ['images.' + key]: images[key]
      });

      // var loaded = true;
      // for (var i in images) {
      //   if (!images[i].loaded) {
      //     loaded = false;
      //     break;
      //   }
      // }
      // if (loaded) {
      //   this.setData({ images });
      // }
    }
  },
  getResult: function(url, callback) {
    this._ssid = util.randomText(16);
    $.getResult(url, this._ssid, callback);
  },
  setResult: function(res) {
    $.setResult(this.options.ssid, res);
  },
  postShareResult: function(data) {
    util.post({
      url: '/share/',
      data: data,
      success: function(res) {}.bind(this),
      fail: function(res) {}.bind(this)
    })
  },
  onShareAppMessage: function(res) {
    var that = this;
    if (res.from === 'button') {
      // 来自页面内转发按钮
    }
    var sharePath = '',
      shareTitle = !!this.data.share && !!this.data.share.title && this.data.share.title || '',
      shareImgUrl = !!this.data.share && !!this.data.share.imgUrl && this.data.share.imgUrl || '';
    var setUrlInviter = function(path, parms) {
      if ($.user.isLogin() && path.indexOf("inviter=") < 0) {
        if (path.indexOf("?") != -1) {
          return path += '&inviter=' + parms
        } else {
          return path += '?inviter=' + parms
        }
      } else {
        return path
      }
    }
    if (!!this.data.share && !!this.data.share.path) {
      sharePath = setUrlInviter(this.data.share.path, $.user.data.id)
    } else {
      sharePath = setUrlInviter('/'+util.getCurrentPageUrlWithArgs(), $.user.data.id)
    }
    var postDatas = {
      "title": shareTitle,
      "link": sharePath,
      "image": shareImgUrl,
    }

    return {
      title: shareTitle,
      imageUrl: shareImgUrl,
      path: sharePath,
      success: function(res) {
        console.log(sharePath)
        postDatas.status = 'success';
        if (!!res.shareTickets) {
          postDatas["shareTickets"] = res.shareTickets;
          var subArr = [];
          var i = 0;
          console.log(res.shareTickets)
          res.shareTickets.map(function(item, index, arr) {
            wx.getShareInfo({
              shareTicket: item,
              success: function(res) {
                subArr.push(res)
                i++;
                if (i == arr.length) {
                  postDatas.infos = subArr
                  that.postShareResult(postDatas)
                  console.log(that, '开始提交')
                  return
                }
              }
            })
          })
        } else {
          console.log(postDatas, "没有ticks")
          that.postShareResult(postDatas)
        }
      },
      fail: function(res) {
        var errMsg = res.errMsg;
        if (errMsg.indexOf('cancel') >= 0) {
          postDatas.status = "cancel"
        } else {
          postDatas.status = "error"
        }
        that.postShareResult(postDatas)
        console.log(res, "失败")
      },
      complete: function(res) {}
    }
  },
};

var Cool = function() {
  var res = Object.assign({}, Base, Loader, Toast, ...arguments);
  var onLoad = res.onLoad;
  res.onLoad = function(options) {
    this._onLoad = onLoad.bind(this, options);
    wx.showShareMenu({
      withShareTicket: true
    })
    if (options.inviter) {
      $.user.postBindRelation(options.inviter)
    }
    return this.onLoadWrapper(options);
  }
  var onShow = res.onShow;
  res.onShow = function() {
    this._onShow = onShow.bind(this);
    return this.onShowWrapper();
  }
  return res;
};
clone(Cool, util);
Cool.config = config;
Cool.user = user;
var $ = Cool;

module.exports = Cool;