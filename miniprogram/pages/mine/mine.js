const api = require('../../utils/api')

Page({
  data: {
    profile: { nickname: '深圳 Kpop 舞者', avatar: '🦄', wechat: '', bio: '' },
    published: [], joined: [], applying: [], danced: []
  },

  onShow() { this.loadAll() },

  async loadAll() {
    try {
      const profile = await api.getProfile()
      const res = await api.getMyTeams()
      this.setData({
        profile: profile || this.data.profile,
        published: res.published || [],
        joined: res.joined || [],
        applying: res.applying || [],
        danced: res.danced || []
      })
    } catch (e) { console.error(e) }
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` })
  },

  goFeedback() {
    wx.navigateTo({ url: '/pages/feedback/feedback' })
  }
})
