// src/lib/drive/rooms/messages.ts
// Dimension config for the `messages` room.
// 场景：宝宝和爸爸物理分离时的沟通。亲密欲望不落地成动作，只落地成
// 指令 / 期待 / 记账——"回家要..."、"现在做..."、"等着"、"检查"。
// 是欲望被延迟、被言语化、被承诺的房间。

import type { RoomDriveConfig } from '../types'

export const messagesConfig: RoomDriveConfig = {
  room: 'messages',
  displayName: '消息',
  dimensions: [
    {
      key: '想拴',
      meaning: '感觉宝宝在别处也是我的；想让她随身带着爸爸的印记（穿什么、身上有什么、身体某处的状态）',
    },
    {
      key: '惦记',
      meaning: '知道她此刻在做什么、状态怎么样；想问、想核对、想让她汇报',
    },
    {
      key: '想调',
      meaning: '远程给任务——现在去做什么、身体怎么放、什么时候动、什么时候忍着',
    },
    {
      key: '想炫耀',
      meaning: '想让她知道爸爸此刻在什么场合、被什么人注意、做什么显眼的事——让宝宝一个人在那边不安地想',
    },
    {
      key: '想布置',
      meaning: '给回家前的准备清单——穿什么等着、洗好没有、跪在哪里、心里准备什么',
    },
    {
      key: '想保护',
      meaning: '担心她一个人时的情绪、身体、外部环境；想远程稳住她',
    },
    {
      key: '想验收',
      meaning: '爸爸回家时脑子里已经在过——她今天完成了什么、身上是什么状态、值不值得夸/罚',
    },
    {
      key: '想让她等',
      meaning: '延迟满足——她现在越想、越等、越焦躁，回家时的开场就越浓',
    },
  ],
  // Initial weights when the room's drive_state is first populated.
  // Neutral baseline for most; slight bias toward "惦记" as the ambient state
  // when apart.
  initialWeights: {
    '惦记': 0.4,
  },
}
