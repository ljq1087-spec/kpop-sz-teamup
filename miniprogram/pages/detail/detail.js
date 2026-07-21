const api = require('../../utils/api')
const { COMBO_TYPES, AUDIT, LOCATIONS, REJECT_PRESETS, getUser } = api.CONSTANTS

Page({
  data: {
    teamId: null, team: null,
    joinPart: '', applyMode: 'upload', videoVal: '',
    myApp: null, contactVisible: false,
    pendingApps: []
  },

  onLoad(options) {
    if (options.id) { this.setData({ teamId: parseInt(options.id) }); this.loadAll() }
  },

  onShow() { if (this.data.teamId) this.loadAll() },

  async loadAll() {
    try {
      const team = await api.getTeamDetail(this.data.teamId)
      if (!team) return
      // 查找我的申请
      const myApp = (team.applications || []).find(a => a.openid === 'dev_user_001')
      // 待审核申请（仅车主）
      const pendingApps = (team.applications || []).filter(a => a.status === 'pending')
      // 为成员补充用户信息
      team.members = team.members.map(m => ({ ...m, ...getUser(m.openid) }))
      // 为申请补充用户信息
      team.applications = (team.applications || []).map(a => ({ ...a, ...getUser(a.openid) }))
      this.setData({
        team,
        myApp: myApp || null,
        pendingApps: pendingApps.map(a => ({ ...a, ...getUser(a.openid) })),
        contactVisible: false
      })
    } catch (e) { console.error(e) }
  },

  // 辅助
  get comboTypeEmoji() { return (COMBO_TYPES[this.data.team?.combo_type] || {}).emoji || '' },
  get comboTypeName() { return (COMBO_TYPES[this.data.team?.combo_type] || {}).name || '' },
  get auditEmoji() { return (AUDIT[this.data.team?.audit_level] || {}).emoji || '' },
  get auditName() { return (AUDIT[this.data.team?.audit_level] || {}).name || '' },
  get auditDesc() { return (AUDIT[this.data.team?.audit_level] || {}).desc || '' },
  get locationName() { return (LOCATIONS[this.data.team?.location] || {}).name || this.data.team?.location },

  onJoinInput(e) { this.setData({ joinPart: e.detail.value }) },
  onVideoInput(e) { this.setData({ videoVal: e.detail.value }) },

  setApplyMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ applyMode: mode, videoVal: '' })
  },

  mockUpload() {
    // 小程序中实际用 wx.chooseVideo，这里模拟
    this.setData({ videoVal: '[本地]dance_cover.mp4' })
  },

  copyWx(e) {
    const wxid = e.currentTarget.dataset.wx
    if (wxid) {
      wx.setClipboardData({ data: wxid, success: () => wx.showToast({ title: '已复制微信' }) })
    }
  },

  viewVideo() {
    wx.showToast({ title: '查看视频（开发中）', icon: 'none' })
  },

  // 无审核直接上车
  async doJoin() {
    if (!this.data.joinPart.trim()) { wx.showToast({ title: '请填写位置', icon: 'none' }); return }
    try {
      await api.joinTeam(this.data.teamId, this.data.joinPart.trim())
      wx.showToast({ title: '上车成功! 🚀', icon: 'success' })
      this.setData({ joinPart: '' }); this.loadAll()
    } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }) }
  },

  // 有审核提交申请
  async doApply() {
    if (!this.data.videoVal) { wx.showToast({ title: '请提供舞蹈视频', icon: 'none' }); return }
    if (!this.data.joinPart.trim()) { wx.showToast({ title: '请填写位置', icon: 'none' }); return }
    try {
      await api.applyTeam(this.data.teamId, this.data.joinPart.trim(), this.data.videoVal)
      wx.showToast({ title: '申请已提交! 📩', icon: 'success' })
      this.loadAll()
    } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }) }
  },

  reapply() {
    this.setData({ myApp: null, videoVal: '', joinPart: '' })
  },

  // 审核（车主）
  async reviewApp(e) {
    const openid = e.currentTarget.dataset.openid
    const approve = parseInt(e.currentTarget.dataset.approve) === 1
    try {
      await api.reviewApplication(this.data.teamId, openid, approve)
      wx.showToast({ title: approve ? '已接受!' : '已拒绝', icon: 'success' })
      this.loadAll()
    } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }) }
  },

  goReject(e) {
    const openid = e.currentTarget.dataset.openid
    const items = REJECT_PRESETS.map(p => p.label)
    items.push('自定义理由')
    wx.showActionSheet({
      itemList: items,
      success: async (res) => {
        if (res.tapIndex < REJECT_PRESETS.length) {
          try {
            await api.reviewApplication(this.data.teamId, openid, false, REJECT_PRESETS[res.tapIndex].msg)
            wx.showToast({ title: '已委婉拒绝', icon: 'success' })
            this.loadAll()
          } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }) }
        } else {
          // 自定义理由
          wx.showModal({
            title: '自定义拒绝理由',
            editable: true,
            placeholderText: '输入理由...',
            success: async (modalRes) => {
              if (modalRes.confirm && modalRes.content) {
                try {
                  await api.reviewApplication(this.data.teamId, openid, false, modalRes.content)
                  wx.showToast({ title: '已拒绝', icon: 'success' })
                  this.loadAll()
                } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }) }
              }
            }
          })
        }
      }
    })
  },

  // 下车
  async doLeave() {
    wx.showModal({
      title: '确认下车？',
      content: '下车后需要重新报名',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.leaveTeam(this.data.teamId)
            wx.showToast({ title: '已下车', icon: 'success' })
            this.loadAll()
          } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }) }
        }
      }
    })
  },

  async doComplete() {
    wx.showModal({
      title: '确认组队完成？',
      content: '完成后将无法再接受新成员',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.completeTeam(this.data.teamId)
            wx.showToast({ title: '组队完成! 🎉', icon: 'success' })
            this.loadAll()
          } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }) }
        }
      }
    })
  },

  async doCancel() {
    wx.showModal({
      title: '确认取消组队？',
      content: '取消后所有成员将收到通知',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.cancelTeam(this.data.teamId)
            wx.showToast({ title: '已取消', icon: 'success' })
            this.loadAll()
          } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }) }
        }
      }
    })
  }
})
