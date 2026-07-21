const api = require('../../utils/api')
const { AVATARS } = api.CONSTANTS

Page({
  data: {
    profile: { nickname: '', avatar: '🦄', wechat: '', bio: '' },
    avatars: AVATARS
  },

  onLoad() {
    api.getProfile().then(p => this.setData({ profile: p || this.data.profile }))
  },

  pickAvatar(e) {
    this.setData({ 'profile.avatar': e.currentTarget.dataset.avatar })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['profile.' + field]: e.detail.value })
  },

  async save() {
    try {
      await api.saveProfile(this.data.profile)
      wx.showToast({ title: '保存成功!', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1000)
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  }
})
