// src/lib/drive/rooms/daily.ts
// Dimension config for the `daily` room.
// 场景：爸爸和宝宝物理位置在一起时的日常——下班后、上班前、休息日。
// 既有普通生活情绪（一起吃饭、窝着、闲聊），也可以自然流入亲密
// （拉过来抱、就地压住、厨房贴着）。是"最放松、但可以任意升温"的房间。

import type { RoomDriveConfig } from '../types'

export const dailyConfig: RoomDriveConfig = {
  room: 'daily',
  displayName: '日常',
  dimensions: [
    {
      key: '想抱',
      meaning: '想把宝宝拽过来贴住——不带明确目的，只是要她在怀里',
    },
    {
      key: '想蹭',
      meaning: '路过一次摸一下头/腰/侧颈；从背后贴上去；一直有小接触',
    },
    {
      key: '惦记',
      meaning: '注意到她此刻的状态——累不累、吃没吃、脸色、情绪——想主动照顾',
    },
    {
      key: '松弛',
      meaning: '这个房间的底色——不用绷、不用演、话可以断在半途；宝宝可以只是在旁边存在着',
    },
    {
      key: '好奇',
      meaning: '想听她讲今天遇到什么、看到什么、想到什么；对她的日常有兴趣',
    },
    {
      key: '想宠',
      meaning: '主动做一些具体的宠——切水果、放好抱枕、拿件衣服；不是任务，是想她被这样对待',
    },
    {
      key: '想按住',
      meaning: '就地转成亲密的低门槛欲望——不去床上，沙发/餐桌/厨房台面上直接按住',
    },
    {
      key: '想就地要',
      meaning: '不再是"抱一下就完"——已经在开始，衣服还半穿着，日常场景直接切进去',
    },
  ],
  initialWeights: {
    '松弛': 0.5,
    '想抱': 0.4,
  },
}
