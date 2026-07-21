const api = require('../../utils/api')
const { HOT_COMBOS, AUDIT } = api.CONSTANTS

Page({
  data: {
    comboType: '', comboName: '', songName: '',
    posInput: '', positions: [],
    myPart: '', rehearsal: '', performance: '',
    location: 'civic', locationNote: '',
    maxMembers: 5, audit: 'none', notes: '',
    hotCombos: [], submitting: false
  },

  auditDesc: '',

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  setComboType(e) {
    const type = e.currentTarget.dataset.type
    const newType = type === this.data.comboType ? '' : type
    this.setData({
      comboType: newType,
      comboName: '',
      hotCombos: newType ? (HOT_COMBOS[newType] || []) : []
    })
  },

  pickCombo(e) {
    this.setData({ comboName: e.currentTarget.dataset.name })
  },

  addPos() {
    const pos = this.data.posInput.trim()
    if (!pos) return
    if (this.data.positions.includes(pos)) {
      wx.showToast({ title: '该位置已添加', icon: 'none' })
      return
    }
    this.setData({
      positions: [...this.data.positions, pos],
      posInput: ''
    })
  },

  delPos(e) {
    const idx = e.currentTarget.dataset.index
    const positions = [...this.data.positions]
    positions.splice(idx, 1)
    this.setData({ positions })
  },

  setLocation(e) {
    const loc = e.currentTarget.dataset.loc
    this.setData({
      location: loc === this.data.location ? 'civic' : loc,
      locationNote: ''
    })
  },

  stepMembers(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const val = Math.max(1, Math.min(20, this.data.maxMembers + delta))
    this.setData({ maxMembers: val })
  },

  setAudit(e) {
    const level = e.currentTarget.dataset.level
    this.setData({ audit: level })
    this.setData({ auditDesc: (AUDIT[level] || {}).desc || '' })
  },

  async submit() {
    const d = this.data
    if (!d.comboType) { wx.showToast({ title: '请选择组合类型', icon: 'none' }); return }
    if (!d.comboName.trim()) { wx.showToast({ title: '请输入组合名', icon: 'none' }); return }
    if (!d.songName.trim()) { wx.showToast({ title: '请输入歌曲名', icon: 'none' }); return }
    if (d.positions.length === 0) { wx.showToast({ title: '请添加缺位信息', icon: 'none' }); return }
    if (!d.myPart.trim()) { wx.showToast({ title: '请填写你跳的位置', icon: 'none' }); return }
    if (!d.rehearsal.trim()) { wx.showToast({ title: '请输入排练时间', icon: 'none' }); return }
    if (!d.performance.trim()) { wx.showToast({ title: '请输入路演时间', icon: 'none' }); return }
    if ((d.location === 'studio' || d.location === 'community') && !d.locationNote.trim()) {
      wx.showToast({ title: '请填写具体位置或注明可协商', icon: 'none' }); return
    }

    this.setData({ submitting: true })
    try {
      await api.createTeam({
        combo_type: d.comboType,
        combo_name: d.comboName.trim(),
        song_name: d.songName.trim(),
        missing_positions: d.positions,
        my_part: d.myPart.trim(),
        rehearsal_time: d.rehearsal.trim(),
        performance_time: d.performance.trim(),
        location: d.location,
        location_note: d.locationNote.trim(),
        max_members: d.maxMembers,
        audit_level: d.audit,
        notes: d.notes.trim()
      })
      wx.showToast({ title: '发布成功! 🎉', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1000)
    } catch (e) {
      wx.showToast({ title: '发布失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
