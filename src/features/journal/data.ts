export interface Story {
  id: string
  category: '灵感' | '生活' | '城市'
  title: string
  summary: string
  author: string
  minutes: number
  cover?: string
  color: string
  paragraphs: string[]
}

export const stories: Story[] = [
  {
    id: 'bookshop',
    category: '城市',
    title: '一间书店，一整个下午',
    summary: '放慢一点，去书页和阳光之间，找回属于自己的节奏。',
    author: '拾页编辑部',
    minutes: 5,
    cover: '/static/editorial/bookshop.jpg',
    color: 'sand',
    paragraphs: [
      '周末不一定要安排得满满当当。走进一间没去过的书店，把手机放进口袋，选一个靠窗的位置，就已经是很好的开始。',
      '我们总是习惯带着目的阅读。但偶尔，随手抽出一本书，从任意一页读起，反而能遇到意料之外的句子。它未必解决什么问题，却让心里的一小块地方安静下来。',
      '下午的光慢慢移过桌面，咖啡也渐渐凉了。把喜欢的段落记下来，再写一句此刻的想法。读过的文字，就这样变成了自己的生活。',
      '离开的时候，不一定要带走一本书。带走一个想继续了解的问题，或者一份久违的轻松，也很好。',
    ],
  },
  {
    id: 'small-notes',
    category: '灵感',
    title: '不用写得很好，先记下来',
    summary: '让记录变轻的三个小习惯。',
    author: '林间',
    minutes: 3,
    color: 'sage',
    paragraphs: [
      '很多时候，我们不是没有灵感，而是等待一个足够完整的想法。于是，好奇、观察和一闪而过的句子，都被留在了昨天。',
      '试着从一句话开始。记录今天注意到的一个细节，不要求结构，也不急着给它起一个漂亮的标题。',
      '给每一条记录一个简单的分类：生活、灵感，或者城市。整理不必成为负担，只要方便未来的自己再次找到它。',
      '每周留十分钟，翻一翻这些散落的片段。你会发现，那些看似普通的日子，其实一直在生长。',
    ],
  },
  {
    id: 'weekend',
    category: '生活',
    title: '把周末留给一件小事',
    summary: '做顿早餐，走一段路，认真感受日常。',
    author: '陈慢慢',
    minutes: 4,
    color: 'peach',
    paragraphs: [
      '我们给周末列了许多计划，却常常忘记留一点空白。其实，一件小事就可以让这两天变得不同。',
      '去附近的市场挑一束花，沿着熟悉的街道多走一个路口，或者为自己做一顿不赶时间的早餐。',
      '不需要打卡，也不需要分享。只要做这件事的时候，你知道自己喜欢，就足够了。',
    ],
  },
]

export const noteCategories = ['全部', '灵感', '生活', '城市'] as const
export type NoteCategory = Exclude<typeof noteCategories[number], '全部'>

export interface JournalNote {
  id: string
  title: string
  content: string
  category: NoteCategory
  updatedAt: string
}

export const initialNotes: JournalNote[] = [
  { id: 'morning', title: '把灵感放进口袋', content: '不必等想法完整。先记下一句话，剩下的交给时间。', category: '灵感', updatedAt: '2026-09-12' },
  { id: 'city-walk', title: '下一次，去城市的另一面', content: '找一家独立书店，沿着河边走走，在没坐过的长椅上看日落。', category: '城市', updatedAt: '2026-09-11' },
  { id: 'weekend-list', title: '我的周末小清单', content: '买一束花。做一顿认真吃的早餐。整理最近读过的书。', category: '生活', updatedAt: '2026-09-09' },
]
