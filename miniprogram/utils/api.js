/**
 * API 请求封装 v3.0 — 包含找替、反馈、成员管理、简介权限等
 */

const BASE_URL = 'https://your-server.com'
const DEV_MODE = true

// ──�� 常量 ───
const COMBO_TYPES = {
  boy: { name: '男团', emoji: '🕺' },
  girl: { name: '女团', emoji: '💃' },
  mixed: { name: '男女混合', emoji: '👫' }
}

const HOT_COMBOS = {
  boy: ['BTS', 'SEVENTEEN', 'Stray Kids', 'ENHYPEN', 'TXT', 'ATEEZ', 'RIIZE', 'THE BOYZ', 'NCT DREAM', 'BOYNEXTDOOR'],
  girl: ['aespa', 'BLACKPINK', 'IVE', 'NewJeans', 'LE SSERAFIM', '(G)I-DLE', 'TWICE', 'ITZY', 'ILLIT', 'Red Velvet'],
  mixed: ['KARD', 'AKMU', 'Koyote', 'Triple H', 'Sunny Hill', '8eight', "Coed School", "Roo'Ra"]
}

const AUDIT = {
  none: { name: '无审核', emoji: '🟢', desc: '先到先得，直接上车' },
  light: { name: '微审', emoji: '🔵', desc: '车主简单看下舞蹈视频即可' },
  medium: { name: '中审', emoji: '🟡', desc: '车主会认真看舞蹈基础' },
  medium_strict: { name: '中严审', emoji: '🟠', desc: '要求有一定成品经验' },
  strict: { name: '严审', emoji: '🔴', desc: '要求成品位 / 高水平舞者' }
}

const LOCATIONS = {
  civic: { name: '市民中心' },
  studio: { name: '自助舞室' },
  community: { name: '党群服务中心' },
  negotiable: { name: '排练地点可协商' }
}

const NOTE_HINTS = [
  '1. 服装要求（如：统一黑色上衣）',
  '2. 跳车需找替（临时去不了要自己找人顶替）',
  '3. 需成年',
  '4. 上哪场路演（如：8.8 市民中心随舞）'
]

const AVATARS = ['🦄', '🌸', '🔥', '⭐', '🐯', '🍓', '💜', '🎀', '🐰', '🌟', '🍑', '🐱']

const REJECT_PRESETS = [
  { key: 'full', label: '坑位已满', msg: '这次坑位刚好满啦，但你的视频真的超棒！下次有空缺我第一时间喊你🙌' },
  { key: 'familiar', label: '想要熟脸', msg: '感觉你基础很棒！不过这版更想要熟脸搭子，先关注你啦，下次优先找你🌟' }
]

// ─── 用户数据 ───
const ME_USER = { openid: 'dev_user_001', nickname: '深圳 Kpop 舞者', avatar: '🦄', wechat: 'kpop_sz_001', bio: '男团女团都爱，路演狂热分子🎀 跳过 aespa/IVE/SEVENTEEN' }

const USERS = {
  'user_001': { nickname: '小舞', avatar: '🌸', wechat: 'xiaowu_dance', bio: '女团博爱粉，主跳 aespa/IVE' },
  'user_002': { nickname: '阿琳', avatar: '🍓', wechat: 'alin_kpop', bio: 'winter位专业户，会扣动作' },
  'user_003': { nickname: '葡萄', avatar: '🍇', wechat: 'putao_sz', bio: '新手友好型车主，带你飞' },
  'user_004': { nickname: '柠檬', avatar: '🍋', wechat: 'lemon_k', bio: 'IVE忠实粉丝' },
  'user_005': { nickname: '草莓', avatar: '🍓', wechat: 'caomei_d', bio: '路演常客，熟悉流程' },
  'user_006': { nickname: '芒果', avatar: '🥭', wechat: 'mango_k', bio: '爱跳女团，动作干净' },
  'user_007': { nickname: '樱桃', avatar: '🍒', wechat: 'yingtao_d', bio: '成品位追求者，严控质量' },
  'user_008': { nickname: '西瓜', avatar: '🍉', wechat: 'xigua_k', bio: '卡点狂魔' },
  'user_009': { nickname: '蜜桃', avatar: '🍑', wechat: 'mitao_d', bio: '爱跳、肯练、不鸽' },
  'user_010': { nickname: '布丁', avatar: '🍮', wechat: 'buding_s', bio: '男团舞爱好者，SEVENTEEN粉' },
  'user_011': { nickname: '奶茶', avatar: '🧋', wechat: 'naicha_k', bio: 'SEVENTEEN粉，会扣动作' },
  'user_012': { nickname: '泡芙', avatar: '🧁', wechat: 'puff_k', bio: 'SKZ铁粉，Felix位' },
  'user_013': { nickname: '曲奇', avatar: '🍪', wechat: 'cookie_k', bio: '跳舞上头，不挑位' },
  'user_014': { nickname: '蛋糕', avatar: '🍰', wechat: 'cake_k', bio: '路演搭子，随叫随到' },
  'user_015': { nickname: '果冻', avatar: '🍮', wechat: 'jd_k', bio: 'Felix位，会扣细节' },
  'user_016': { nickname: '布朗尼', avatar: '🟤', wechat: 'brownie_k', bio: 'Seungmin位' },
  'user_017': { nickname: '甜甜圈', avatar: '🍩', wechat: 'donut_k', bio: '爱跳男团' },
  'user_019': { nickname: '拿铁', avatar: '☕', wechat: 'latte_k', bio: 'KARD混团粉' },
  'user_100': { nickname: '跳跳糖', avatar: '🍬', wechat: 'tiaotang_sz', bio: '想上aespa车，练了半年' },
  'user_200': { nickname: '月光', avatar: '🌙', wechat: 'moonlight_k', bio: 'KARD BM位，男' }
}

function getUser(openid) {
  if (openid === 'dev_user_001') return ME_USER
  return USERS[openid] || { openid, nickname: openid, avatar: '🙂', wechat: '', bio: '' }
}

// ─── 模拟数据 ───
let MOCK_TEAMS = [
  {
    id: 1, combo_type: 'girl', combo_name: 'aespa', song_name: 'Iconic',
    missing_positions: ['karina位', 'winter位'],
    rehearsal_time: '8月7日晚', performance_time: '8月8日路演',
    locations: ['civic'], location_note: '',
    max_members: 5, audit_level: 'medium',
    notes: '1. 服装要求：统一黑色上衣\n2. 跳车需找替\n3. 需成年\n4. 上8.8市民中心随舞',
    status: 'active', creator_openid: 'user_001',
    member_count: 2, members: [
      { openid: 'user_001', part: 'giselle位' }, { openid: 'user_002', part: 'winter位' }
    ],
    applications: [{ openid: 'user_100', part: 'karina位', video_url: '[本地]aespa_cover.mp4', message: '练了半个月，求上车！', status: 'pending', reject_count: 0 }],
    substitutes: [], // 找替列表
    created_at: '今天 16:30'
  },
  {
    id: 2, combo_type: 'girl', combo_name: 'IVE', song_name: '恋爱的条件',
    missing_positions: ['姜位', '罗位'],
    rehearsal_time: '周六下午', performance_time: '周日下午',
    locations: ['studio'], location_note: '南山区某自助舞室，具体位置可协商',
    max_members: 5, audit_level: 'none',
    notes: '1. 跳车需找替\n2. 上周日市民中心路演',
    status: 'active', creator_openid: 'user_003',
    member_count: 4, members: [
      { openid: 'user_003', part: 'liz位' }, { openid: 'user_004', part: '安宥真位' },
      { openid: 'user_005', part: '张元英位' }, { openid: 'user_006', part: '直玗位' }
    ], applications: [], substitutes: [], created_at: '今天 15:00'
  },
  {
    id: 3, combo_type: 'girl', combo_name: 'aespa', song_name: 'Whiplash',
    missing_positions: ['柳智敏成品位'],
    rehearsal_time: '7月26日', performance_time: '8月1日路演',
    locations: ['civic'], location_note: '',
    max_members: 5, audit_level: 'strict',
    notes: '1. 严审，要求成品位\n2. 跳车需找替\n3. 需成年\n4. 上8.1路演',
    status: 'active', creator_openid: 'user_007',
    member_count: 3, members: [
      { openid: 'user_007', part: 'karina位' }, { openid: 'user_008', part: '宁宁位' },
      { openid: 'user_009', part: '柳智敏位' }
    ], applications: [], substitutes: [], created_at: '昨天 20:00'
  },
  {
    id: 4, combo_type: 'boy', combo_name: 'SEVENTEEN', song_name: 'MAESTRO',
    missing_positions: ['珉奎位', 'THE8位'],
    rehearsal_time: '下周三晚', performance_time: '下周六路演',
    locations: ['community'], location_note: '福田区党群服务中心，可协商换场地',
    max_members: 4, audit_level: 'light',
    notes: '1. 服装要求：白色T恤\n2. 跳车需找替\n3. 上下周六路演',
    status: 'active', creator_openid: 'user_010',
    member_count: 2, members: [
      { openid: 'user_010', part: 'Hoshi位' }, { openid: 'user_011', part: '净汉位' }
    ], applications: [], substitutes: [], created_at: '7月19日'
  },
  {
    id: 5, combo_type: 'boy', combo_name: 'Stray Kids', song_name: 'Chk Chk Boom',
    missing_positions: ['铉辰位'],
    rehearsal_time: '这周末', performance_time: '下周末路演',
    locations: ['civic'], location_note: '',
    max_members: 8, audit_level: 'medium_strict',
    notes: '1. 跳车需找替\n2. 需成年\n3. 上下周末路演',
    status: 'active', creator_openid: 'user_012',
    member_count: 6, members: [
      { openid: 'user_012', part: 'Bang Chan位' }, { openid: 'user_013', part: 'Lee Know位' },
      { openid: 'user_014', part: 'Changbin位' }, { openid: 'user_015', part: 'Han位' },
      { openid: 'user_016', part: 'Felix位' }, { openid: 'user_017', part: 'Seungmin位' }
    ], applications: [], substitutes: [], created_at: '7月18日'
  },
  {
    id: 6, combo_type: 'mixed', combo_name: 'KARD', song_name: 'Ring The Alarm',
    missing_positions: ['BM位', '전소민位'],
    rehearsal_time: '8月10日', performance_time: '8月15日路演',
    locations: ['studio', 'negotiable'], location_note: '罗湖自助舞室，位置可协商',
    max_members: 4, audit_level: 'medium',
    notes: '1. 男女混合团\n2. 跳车需找替\n3. 上8.15路演',
    status: 'active', creator_openid: 'dev_user_001',
    member_count: 2, members: [
      { openid: 'dev_user_001', part: 'J.Seph位' }, { openid: 'user_019', part: 'Jiwoo位' }
    ],
    applications: [{ openid: 'user_200', part: 'BM位', video_url: '[本地]kard_bm.mp4', message: 'BM位我熟！', status: 'pending', reject_count: 0 }],
    substitutes: [], created_at: '7月17日'
  }
]

// 已完成的队伍（用于"我跳过的舞"）
let COMPLETED_TEAMS = [
  {
    id: 101, combo_type: 'girl', combo_name: 'NewJeans', song_name: 'Super Shy',
    performance_time: '7月10日路演', status: 'completed',
    member_count: 5, members: [{ openid: 'dev_user_001', part: 'Hanni位' }],
    locations: ['civic'], created_at: '7月5日'
  }
]

let MOCK_FEEDBACKS = []
let idCounter = 200

// ─── 导出常量 ───
const CONSTANTS = { COMBO_TYPES, HOT_COMBOS, AUDIT, LOCATIONS, NOTE_HINTS, AVATARS, REJECT_PRESETS, getUser }

// ─── API 方法 ───
module.exports = {
  CONSTANTS,

  // 组队列表
  getTeams(params = {}) {
    return new Promise(resolve => {
      setTimeout(() => {
        let teams = [...MOCK_TEAMS].filter(t => t.status === 'active' || t.status === 'sub_seeking')
        if (params.type) teams = teams.filter(t => t.combo_type === params.type)
        if (params.combo) teams = teams.filter(t => t.combo_name === params.combo)
        if (params.keyword) {
          const kw = params.keyword.toLowerCase()
          teams = teams.filter(t =>
            t.song_name.toLowerCase().includes(kw) ||
            t.combo_name.toLowerCase().includes(kw) ||
            (t.missing_positions || []).some(p => p.toLowerCase().includes(kw))
          )
        }
        const openid = 'dev_user_001'
        teams = teams.map(t => ({
          ...t,
          has_joined: t.members.some(m => m.openid === openid),
          is_creator: t.creator_openid === openid,
          my_reject_count: ((t.applications || []).find(a => a.openid === openid) || {}).reject_count || 0
        }))
        resolve({ teams, total: teams.length })
      }, 150)
    })
  },

  // 组队详情
  getTeamDetail(id) {
    return new Promise(resolve => {
      setTimeout(() => {
        const team = MOCK_TEAMS.find(t => t.id === id)
        if (team) {
          const openid = 'dev_user_001'
          resolve({
            ...team,
            has_joined: team.members.some(m => m.openid === openid),
            is_creator: team.creator_openid === openid
          })
        } else { resolve(null) }
      }, 150)
    })
  },

  // 发布组队
  createTeam(data) {
    return new Promise(resolve => {
      setTimeout(() => {
        const nt = {
          id: ++idCounter, ...data,
          status: 'active', creator_openid: 'dev_user_001',
          member_count: 1,
          members: [{ openid: 'dev_user_001', part: data.my_part || '' }],
          applications: [], substitutes: [], created_at: '刚刚'
        }
        MOCK_TEAMS.unshift(nt)
        resolve({ id: nt.id, message: '发布成功!' })
      }, 200)
    })
  },

  // 直接上车（无审核）
  joinTeam(id, part) {
    return new Promise(resolve => {
      const team = MOCK_TEAMS.find(t => t.id === id)
      if (!team) return resolve({ error: '不存在' })
      if (team.member_count >= team.max_members) return resolve({ error: '已满' })
      team.members.push({ openid: 'dev_user_001', part })
      team.member_count = team.members.length
      // 如果该位置在缺位列表中，移除
      if (part && team.missing_positions.includes(part)) {
        team.missing_positions = team.missing_positions.filter(p => p !== part)
      }
      resolve({ message: '上车成功!' })
    })
  },

  // 提交申请（有审核）— 带一句话 + 拒绝次数检查
  applyTeam(id, part, videoUrl, message) {
    return new Promise(resolve => {
      const team = MOCK_TEAMS.find(t => t.id === id)
      if (!team) return resolve({ error: '不存在' })
      // 检查拒绝次数
      const existing = (team.applications || []).find(a => a.openid === 'dev_user_001')
      if (existing && existing.reject_count >= 2) {
        return resolve({ error: '已被拒绝两次，无法再次申请该队伍' })
      }
      team.applications = (team.applications || []).filter(a => a.openid !== 'dev_user_001')
      team.applications.push({
        openid: 'dev_user_001', part, video_url: videoUrl,
        message: message || '', status: 'pending',
        reject_count: existing ? existing.reject_count : 0
      })
      resolve({ message: '申请已提交' })
    })
  },

  // 下车
  leaveTeam(id) {
    return new Promise(resolve => {
      const team = MOCK_TEAMS.find(t => t.id === id)
      if (!team) return resolve({ error: '不存在' })
      const member = team.members.find(m => m.openid === 'dev_user_001')
      team.members = team.members.filter(m => m.openid !== 'dev_user_001')
      team.applications = (team.applications || []).filter(a => a.openid !== 'dev_user_001')
      team.member_count = team.members.length
      // 如果该成员有位置，加回到缺位列表
      if (member && member.part && !team.missing_positions.includes(member.part)) {
        team.missing_positions.push(member.part)
      }
      resolve({ message: '已下车' })
    })
  },

  // 审核（通过/拒绝）— 拒绝时累加 reject_count
  reviewApplication(teamId, applicantOpenid, approve, rejectMsg) {
    return new Promise(resolve => {
      const team = MOCK_TEAMS.find(t => t.id === teamId)
      if (!team) return resolve({ error: '不存在' })
      const app = (team.applications || []).find(a => a.openid === applicantOpenid)
      if (!app) return resolve({ error: '申请不存在' })
      if (approve) {
        if (team.member_count >= team.max_members) return resolve({ error: '已满' })
        app.status = 'approved'
        team.members.push({ openid: applicantOpenid, part: app.part })
        team.member_count = team.members.length
        if (app.part && team.missing_positions.includes(app.part)) {
          team.missing_positions = team.missing_positions.filter(p => p !== app.part)
        }
      } else {
        app.status = 'rejected'
        app.reject_msg = rejectMsg || '这次坑位已满，期待下次同车～'
        app.reject_count = (app.reject_count || 0) + 1
      }
      resolve({ message: approve ? '已接受' : '已拒绝' })
    })
  },

  // ─── 车主管理成员（需求5）：踢人/换人 ───
  removeMember(teamId, memberOpenid) {
    return new Promise(resolve => {
      const team = MOCK_TEAMS.find(t => t.id === teamId)
      if (!team) return resolve({ error: '不存在' })
      const member = team.members.find(m => m.openid === memberOpenid)
      team.members = team.members.filter(m => m.openid !== memberOpenid)
      team.member_count = team.members.length
      if (member && member.part && !team.missing_positions.includes(member.part)) {
        team.missing_positions.push(member.part)
      }
      // 如果队伍已完成，重新变为组队中（需求8）
      if (team.status === 'completed') {
        team.status = 'active'
      }
      resolve({ message: '已移除成员' })
    })
  },

  // 车主修改某成员的位置
  updateMemberPart(teamId, memberOpenid, newPart) {
    return new Promise(resolve => {
      const team = MOCK_TEAMS.find(t => t.id === teamId)
      if (!team) return resolve({ error: '不存在' })
      const member = team.members.find(m => m.openid === memberOpenid)
      if (member) {
        const oldPart = member.part
        member.part = newPart
        // 旧位置加回缺位，新位置从缺位移除
        if (oldPart && !team.missing_positions.includes(oldPart)) team.missing_positions.push(oldPart)
        if (newPart && team.missing_positions.includes(newPart)) {
          team.missing_positions = team.missing_positions.filter(p => p !== newPart)
        }
      }
      resolve({ message: '已修改' })
    })
  },

  // ─── 找替功能（需求3）───
  // 发布找替
  publishSubstitute(teamId, memberOpenid, part, note) {
    return new Promise(resolve => {
      const team = MOCK_TEAMS.find(t => t.id === teamId)
      if (!team) return resolve({ error: '不存在' })
      team.substitutes = team.substitutes || []
      team.substitutes.push({
        id: Date.now(), team_id: teamId, member_openid: memberOpenid,
        part, note: note || '', status: 'open', applicants: []
      })
      resolve({ message: '找替信息已发布' })
    })
  },

  // 申请当替身
  applySubstitute(teamId, subId) {
    return new Promise(resolve => {
      const team = MOCK_TEAMS.find(t => t.id === teamId)
      if (!team) return resolve({ error: '不存在' })
      const sub = (team.substitutes || []).find(s => s.id === subId)
      if (!sub) return resolve({ error: '找替不存在' })
      sub.applicants = sub.applicants || []
      if (!sub.applicants.find(a => a.openid === 'dev_user_001')) {
        sub.applicants.push({ openid: 'dev_user_001', status: 'pending' })
      }
      resolve({ message: '已申请当替身' })
    })
  },

  // 车主/本人确认替身
  confirmSubstitute(teamId, subId, newOpenid) {
    return new Promise(resolve => {
      const team = MOCK_TEAMS.find(t => t.id === teamId)
      if (!team) return resolve({ error: '不存在' })
      const sub = (team.substitutes || []).find(s => s.id === subId)
      if (!sub) return resolve({ error: '找替不存在' })
      // 替换成员
      const oldMember = team.members.find(m => m.openid === sub.member_openid)
      if (oldMember) {
        oldMember.openid = newOpenid
      }
      sub.status = 'confirmed'
      resolve({ message: '替身已确认' })
    })
  },

  // ─── 重新开放已完成的队伍（需求8）───
  reopenTeam(id) {
    return new Promise(resolve => {
      const team = MOCK_TEAMS.find(t => t.id === id)
      if (!team) return resolve({ error: '不存在' })
      team.status = 'active'
      resolve({ message: '已重新开放组队' })
    })
  },

  // 组队完成
  completeTeam(id) {
    return new Promise(resolve => {
      const team = MOCK_TEAMS.find(t => t.id === id)
      if (team) {
        team.status = 'completed'
        COMPLETED_TEAMS.unshift({ ...team })
        resolve({ message: '完成!' })
      }
      else resolve({ error: '不存在' })
    })
  },

  // 取消组队
  cancelTeam(id) {
    return new Promise(resolve => {
      const team = MOCK_TEAMS.find(t => t.id === id)
      if (team) { team.status = 'cancelled'; resolve({ message: '已取消' }) }
      else resolve({ error: '不存在' })
    })
  },

  // 我的组队
  getMyTeams() {
    return new Promise(resolve => {
      setTimeout(() => {
        const openid = 'dev_user_001'
        const published = MOCK_TEAMS.filter(t => t.creator_openid === openid)
        const joined = MOCK_TEAMS.filter(t => t.creator_openid !== openid && t.members.some(m => m.openid === openid))
        const applying = MOCK_TEAMS.filter(t => (t.applications || []).some(a => a.openid === openid && a.status === 'pending'))
        const danced = COMPLETED_TEAMS.filter(t => t.creator_openid === openid || t.members.some(m => m.openid === openid))
        resolve({ published, joined, applying, danced })
      }, 150)
    })
  },

  // 用户资料
  getProfile() { return new Promise(resolve => setTimeout(() => resolve({ ...ME_USER }), 100)) },
  saveProfile(data) { return new Promise(resolve => { Object.assign(ME_USER, data); setTimeout(() => resolve({ message: '已保存' }), 100) }) },

  // ─── 反馈功能（需求2）───
  submitFeedback(type, content, contact) {
    return new Promise(resolve => {
      MOCK_FEEDBACKS.unshift({
        id: Date.now(), type, content, contact: contact || '',
        status: 'pending', created_at: '刚刚'
      })
      setTimeout(() => resolve({ message: '反馈已提交，感谢！' }), 200)
    })
  },

  getFeedbacks() { return new Promise(resolve => setTimeout(() => resolve({ list: MOCK_FEEDBACKS }), 100)) }
}
