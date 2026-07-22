const api = require('../../utils/api')
const { HOT_COMBOS, AUDIT, LOCATIONS } = api.CONSTANTS

Page({
  data: {
    teams: [],
    keyword: '',
    currentType: '',
    currentCombo: '',
    hotCombos: [],
    loading: true,
    auditEmoji: Object.fromEntries(Object.entries(AUDIT).map(([k, v]) => [k, v.emoji])),
    auditName: Object.fromEntries(Object.entries(AUDIT).map(([k, v]) => [k, v.name]))
  },

  onLoad() { this.loadTeams() },
  onShow() { this.loadTeams() },
  onPullDownRefresh() { this.loadTeams().then(() => wx.stopPullDownRefresh()) },

  async loadTeams() {
    this.setData({ loading: true })
    try {
      const params = {}
      if (this.data.currentType) params.type = this.data.currentType
      if (this.data.currentCombo) params.combo = this.data.currentCombo
      if (this.data.keyword) params.keyword = this.data.keyword
      const res = await api.getTeams(params)
      // 为每个 team 生成 locationText
      const teams = (res.teams || []).map(t => ({
        ...t,
        locationText: (t.locations || []).map(l => (LOCATIONS[l] || {}).name || l).join(' / ') || '未设置'
      }))
      this.setData({ teams, loading: false })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  onSearchInput(e) { this.setData({ keyword: e.detail.value }) },
  onSearch() { this.loadTeams() },
  clearSearch() { this.setData({ keyword: '' }); this.loadTeams() },

  setType(e) {
    const type = e.currentTarget.dataset.type
    const newType = type === this.data.currentType ? '' : type
    this.setData({
      currentType: newType, currentCombo: '',
      hotCombos: newType ? (HOT_COMBOS[newType] || []) : []
    })
    this.loadTeams()
  },

  setCombo(e) {
    const combo = e.currentTarget.dataset.combo
    this.setData({ currentCombo: combo === this.data.currentCombo ? '' : combo })
    this.loadTeams()
  },

  goDetail(e) { wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` }) },
  goPublish() { wx.navigateTo({ url: '/pages/publish/publish' }) }
})
