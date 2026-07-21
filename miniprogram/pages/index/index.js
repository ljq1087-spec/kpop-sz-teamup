const api = require('../../utils/api')
const { COMBO_TYPES, HOT_COMBOS, AUDIT, LOCATIONS } = api.CONSTANTS

Page({
  data: {
    teams: [],
    filteredTeams: [],
    keyword: '',
    currentType: '',
    currentCombo: '',
    hotCombos: [],
    loading: true
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
      this.setData({ teams: res.teams || [], filteredTeams: res.teams || [], loading: false })
    } catch (e) {
      this.setData({ loading: false })
    }
  },

  // 筛选方法
  onSearchInput(e) { this.setData({ keyword: e.detail.value }) },
  onSearch() { this.loadTeams() },
  clearSearch() { this.setData({ keyword: '' }); this.loadTeams() },

  setType(e) {
    const type = e.currentTarget.dataset.type
    const newType = type === this.data.currentType ? '' : type
    this.setData({
      currentType: newType,
      currentCombo: '',
      hotCombos: newType ? (HOT_COMBOS[newType] || []) : []
    })
    this.loadTeams()
  },

  setCombo(e) {
    const combo = e.currentTarget.dataset.combo
    this.setData({ currentCombo: combo === this.data.currentCombo ? '' : combo })
    this.loadTeams()
  },

  // 辅助方法
  locationName(key) { return (LOCATIONS[key] || {}).name || key },
  auditEmoji(key) { return (AUDIT[key] || {}).emoji || '' },
  auditName(key) { return (AUDIT[key] || {}).name || '' },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` })
  },

  goPublish() {
    wx.navigateTo({ url: '/pages/publish/publish' })
  }
})
