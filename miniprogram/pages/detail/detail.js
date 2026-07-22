const api = require('../../utils/api')
const { COMBO_TYPES, AUDIT, LOCATIONS, REJECT_PRESETS, getUser } = api.CONSTANTS

Page({
  data: {
    teamId: null, team: null,
    joinPart: '', applyMode: 'upload', videoVal: '',
    applyMessage: '',
    myApp: null, myRejectCount: 0,
    pendingApps: [],
    locationNames: []
  },

  onLoad(options) {
    if (options.id) { this.setData({ teamId: parseInt(options.id) }); this.loadAll() }
  },
  onShow() { if (this.data.teamId) this.loadAll() },

  async loadAll() {
    try {
      const team = await api.getTeamDetail(this.data.teamId)
      if (!team) return
      const myApp = (team.applications || []).find(a => a.openid === 'dev_user_001')
      const myRejectCount = myApp ? (myApp.reject_count || 0) : 0
      const pendingApps = (team.applications || []).filter(a => a.status === 'pending')
      team.members = team.members.map(m => ({ ...m, ...getUser(m.openid) }))
      team.applications = (team.applications || []).map(a => ({ ...a, ...getUser(a.openid) }))
      // 地点名列表
      const locationNames = (team.locations || []).map(l => (LOCATIONS[l] || {}).name || l)
      this.setData({
        team, myApp: myApp || null, myRejectCount,
        pendingApps: pendingApps.map(a => ({ ...a, ...getUser(a.openid) })),
        locationNames
      })
    } catch (e) { console.error(e) }
  },

  get comboTypeEmoji() { return (COMBO_TYPES[this.data.team?.combo_type] || {}).emoji || '' },
  get comboTypeName() { return (COMBO_TYPES[this.data.team?.combo_type] || {}).name || '' },
  get auditEmoji() { return (AUDIT[this.data.team?.audit_level] || {}).emoji || '' },
  get auditName() { return (AUDIT[this.data.team?.audit_level] || {}).name || '' },
  get auditDesc() { return (AUDIT[this.data.team?.audit_level] || {}).desc || '' },

  onJoinInput(e) { this.setData({ joinPart: e.detail.value }) },
  onVideoInput(e) { this.setData({ videoVal: e.detail.value }) },
  onMsgInput(e) { this.setData({ applyMessage: e.detail.value }) },
  setApplyMode(e) { this.setData({ applyMode: e.currentTarget.dataset.mode, videoVal: '' }) },
  mockUpload() { this.setData({ videoVal: '[本地]dance_cover.mp4' }) },

  copyWx(e) {
    const wxid = e.currentTarget.dataset.wx
    if (wxid) wx.setClipboardData({ data: wxid, success: () => wx.showToast({ title: '已复制微信' }) })
  },

  viewVideo() { wx.showToast({ title: '查看视频（开发中）', icon: 'none' }) },

  // 点击成员头像（需求9：组队完成后看简介）
  onMemberTap(e) {
    const openid = e.currentTarget.dataset.openid
    const team = this.data.team
    if (!team) return
    const member = team.members.find(m => m.openid === openid)
    if (!member) return
    const user = getUser(openid)
    const isMe = openid === 'dev_user_001'
    const isCreator = openid === team.creator_openid
    // 组队完成后，或者点击的是车主/自己，可以看到简介
    const canSeeBio = team.status === 'completed' || isCreator || isMe || team.is_creator
    let content = `昵称：${user.nickname || '匿名'}\n位置：${member.part || '未填写'}`
    if (canSeeBio && user.bio) content += `\n简介：${user.bio}`
    if (canSeeBio && user.wechat) content += `\n微信：${user.wechat}`
    if (!canSeeBio) content += '\n\n🔒 组队完成后可查看完整简介'
    wx.showModal({ title: isCreator ? '👑 车主信息' : '💃 舞者信息', content, showCancel: false })
  },

  // 车主管理成员（需求5）
  showMemberMenu(e) {
    const openid = e.currentTarget.dataset.openid
    const part = e.currentTarget.dataset.part
    wx.showActionSheet({
      itemList: ['修改成员位置', '移除该成员'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.showModal({
            title: '修改位置', editable: true, placeholderText: part || '输入新位置',
            success: async (m) => {
              if (m.confirm && m.content) {
                await api.updateMemberPart(this.data.teamId, openid, m.content.trim())
                wx.showToast({ title: '已修改', icon: 'success' })
                this.loadAll()
              }
            }
          })
        } else if (res.tapIndex === 1) {
          wx.showModal({
            title: '确认移除？', content: '该成员将被移出队伍，其位置会重新加入缺位列表',
            success: async (m) => {
              if (m.confirm) {
                await api.removeMember(this.data.teamId, openid)
                wx.showToast({ title: '已移除', icon: 'success' })
                this.loadAll()
              }
            }
          })
        }
      }
    })
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

  // 有审核提交申请（需求10：附带消息）
  async doApply() {
    if (!this.data.videoVal) { wx.showToast({ title: '请提供舞蹈视频', icon: 'none' }); return }
    if (!this.data.joinPart.trim()) { wx.showToast({ title: '请填写位置', icon: 'none' }); return }
    try {
      await api.applyTeam(this.data.teamId, this.data.joinPart.trim(), this.data.videoVal, this.data.applyMessage.trim())
      wx.showToast({ title: '申请已提交! 📩', icon: 'success' })
      this.setData({ joinPart: '', videoVal: '', applyMessage: '' })
      this.loadAll()
    } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }) }
  },

  reapply() { this.setData({ myApp: null, videoVal: '', joinPart: '', applyMessage: '' }) },

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
          await api.reviewApplication(this.data.teamId, openid, false, REJECT_PRESETS[res.tapIndex].msg)
          wx.showToast({ title: '已委婉拒绝', icon: 'success' })
          this.loadAll()
        } else {
          wx.showModal({
            title: '自定义拒绝理由', editable: true, placeholderText: '输入理由...',
            success: async (m) => {
              if (m.confirm && m.content) {
                await api.reviewApplication(this.data.teamId, openid, false, m.content)
                wx.showToast({ title: '已拒绝', icon: 'success' })
                this.loadAll()
              }
            }
          })
        }
      }
    })
  },

  // 找替（需求3）
  goFindSubstitute() {
    const team = this.data.team
    const myMember = team.members.find(m => m.openid === 'dev_user_001')
    wx.showModal({
      title: '🔄 找人替我',
      content: `你的位置：${myMember?.part || '未填写'}\n发布后会在组队页显示找替信息`,
      editable: true, placeholderText: '补充说明（选填）',
      success: async (res) => {
        if (res.confirm) {
          await api.publishSubstitute(this.data.teamId, 'dev_user_001', myMember?.part || '', res.content || '')
          wx.showToast({ title: '找替信息已发布', icon: 'success' })
          this.loadAll()
        }
      }
    })
  },

  async applySubstitute(e) {
    const subId = parseInt(e.currentTarget.dataset.subId)
    try {
      await api.applySubstitute(this.data.teamId, subId)
      wx.showToast({ title: '已申请当替身', icon: 'success' })
      this.loadAll()
    } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }) }
  },

  async confirmSub(e) {
    const subId = parseInt(e.currentTarget.dataset.subId)
    const openid = e.currentTarget.dataset.openid
    try {
      await api.confirmSubstitute(this.data.teamId, subId, openid)
      wx.showToast({ title: '替身已确认', icon: 'success' })
      this.loadAll()
    } catch (e) { wx.showToast({ title: '操作失败', icon: 'none' }) }
  },

  async doLeave() {
    wx.showModal({
      title: '确认下车？', content: '下车后你的位置会重新加入缺位列表',
      success: async (res) => {
        if (res.confirm) {
          await api.leaveTeam(this.data.teamId)
          wx.showToast({ title: '已下车', icon: 'success' })
          this.loadAll()
        }
      }
    })
  },

  async doComplete() {
    wx.showModal({
      title: '确认组队完成？', content: '完成后成员可见彼此微信和简介',
      success: async (res) => {
        if (res.confirm) {
          await api.completeTeam(this.data.teamId)
          wx.showToast({ title: '组队完成! 🎉', icon: 'success' })
          this.loadAll()
        }
      }
    })
  },

  // 重新开放（需求8）
  async doReopen() {
    wx.showModal({
      title: '重新开放组队？', content: '队伍将重新变为组队中状态，可继续接受新成员',
      success: async (res) => {
        if (res.confirm) {
          await api.reopenTeam(this.data.teamId)
          wx.showToast({ title: '已重新开放', icon: 'success' })
          this.loadAll()
        }
      }
    })
  },

  async doCancel() {
    wx.showModal({
      title: '确认取消组队？', content: '取消后所有成��将收到通知',
      success: async (res) => {
        if (res.confirm) {
          await api.cancelTeam(this.data.teamId)
          wx.showToast({ title: '已取消', icon: 'success' })
          this.loadAll()
        }
      }
    })
  }
})
