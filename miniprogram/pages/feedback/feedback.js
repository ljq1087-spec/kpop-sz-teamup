const api = require('../../utils/api')

const FEEDBACK_TYPES = [
  { key: 'bug', name: 'Bug 反馈', emoji: '🐛' },
  { key: 'feature', name: '功能建议', emoji: '💡' },
  { key: 'complaint', name: '投诉', emoji: '😤' },
  { key: 'other', name: '其他', emoji: '📝' }
]

Page({
  data: {
    types: FEEDBACK_TYPES,
    type: '',
    content: '',
    contact: '',
    submitting: false,
    history: []
  },

  onShow() { this.loadHistory() },

  pickType(e) { this.setData({ type: e.currentTarget.dataset.key }) },
  onContentInput(e) { this.setData({ content: e.detail.value }) },
  onContactInput(e) { this.setData({ contact: e.detail.value }) },

  async submit() {
    if (!this.data.type) { wx.showToast({ title: '请选择反馈类型', icon: 'none' }); return }
    if (!this.data.content.trim()) { wx.showToast({ title: '请填写反馈内容', icon: 'none' }); return }
    this.setData({ submitting: true })
    try {
      await api.submitFeedback(this.data.type, this.data.content.trim(), this.data.contact.trim())
      wx.showToast({ title: '反馈已提交! 🙏', icon: 'success' })
      this.setData({ type: '', content: '', contact: '' })
      this.loadHistory()
    } catch (e) {
      wx.showToast({ title: '提交失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  async loadHistory() {
    try {
      const res = await api.getFeedbacks()
      const list = (res.list || []).map(f => ({
        ...f,
        typeName: (FEEDBACK_TYPES.find(t => t.key === f.type) || {}).name || f.type
      }))
      this.setData({ history: list })
    } catch (e) {}
  }
})
