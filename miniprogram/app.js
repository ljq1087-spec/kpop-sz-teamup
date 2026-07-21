App({
  globalData: {
    openid: '',
    token: '',
    nickname: '',
    avatarUrl: '',
    apiBase: 'https://your-server.com'  // 替换为你的服务器地址
  },

  onLaunch() {
    // 开发阶段使用本地存储的 openid
    const openid = wx.getStorageSync('openid') || 'dev_user_001'
    this.globalData.openid = openid
    if (!wx.getStorageSync('openid')) {
      wx.setStorageSync('openid', openid)
    }
  }
})
