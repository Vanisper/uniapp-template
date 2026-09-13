/** 示例内容所属分类 */
export type PagingCategory = '生活' | '城市' | '灵感'

/** 分页示例中的阅读条目 */
export interface PagingArticle {
  id: number
  title: string
  category: PagingCategory
  summary: string
  minutes: number
}

/** 可重复体验的本地响应场景 */
export type PagingScenario = 'normal' | 'empty' | 'first-error' | 'more-error'

/** 单次分页请求参数，页码从 1 开始 */
export interface PagingQuery {
  pageNo: number
  pageSize: number
  keyword?: string
  category?: string
}

const articleSeeds: [string, PagingCategory, string][] = [
  ['给周末留一点空白', '生活', '慢下来，把日程的一小格留给自己。'],
  ['沿着河岸走回家', '城市', '换一条熟悉的路，看见城市的另一面。'],
  ['把灵感装进口袋', '灵感', '用简单的记录，留下稍纵即逝的想法。'],
  ['一杯咖啡的时间', '生活', '在忙碌之间，找回片刻专注。'],
  ['街角新开了一家书店', '城市', '推开门，让一本书决定今天的去处。'],
  ['收集生活里的绿色', '灵感', '从树叶、窗台和纸张中，找一组新的配色。'],
  ['早起后的十分钟', '生活', '打开窗，把一天的开始交给晨光。'],
  ['寻找城市里的旧招牌', '城市', '字形和颜色，保存着一条街的记忆。'],
  ['写一封给未来的信', '灵感', '记录此刻在意的事，也留下一些问题。'],
  ['在家做一顿简单的饭', '生活', '少一点步骤，多一点食材本来的味道。'],
  ['去公园坐一会儿', '城市', '没有目的地的时候，长椅也是好去处。'],
  ['从一张照片开始', '灵感', '观察光线和留白，为想法找到入口。'],
  ['整理桌面，也整理心情', '生活', '留下常用的东西，让空间重新呼吸。'],
  ['乘公交去终点站', '城市', '让一条线路，带你经过不熟悉的街区。'],
  ['给普通事物起个名字', '灵感', '换一种描述，就多一种看待日常的方式。'],
  ['把晚饭后的散步留下来', '生活', '一个容易坚持的小习惯，让日子松弛一点。'],
  ['雨天的城市声音', '城市', '听见屋檐、车轮和行人组成的节奏。'],
  ['开始一本小小的手账', '灵感', '不必写得完整，一句话也算记录。'],
  ['给窗台添一盆植物', '生活', '观察一片新叶，练习耐心。'],
  ['逛一逛周末市集', '城市', '和手作者聊聊，发现物件背后的故事。'],
  ['从限制里找到创意', '灵感', '只用三种颜色，试着画下今天。'],
  ['为自己准备一份早餐', '生活', '花一点时间，把寻常的早晨过得认真。'],
  ['落日前再走一条街', '城市', '最后一束暖光，总会照亮意外的角落。'],
]

export const pagingArticles: readonly PagingArticle[] = articleSeeds.map(([title, category, summary], index) => ({
  id: index + 1,
  title,
  category,
  summary,
  minutes: 3 + index % 5,
}))

export const pagingCategories = ['全部', '生活', '城市', '灵感'] as const
export const pagingPageSize = 6
export const pagingDelay = 500

/** 可取消的本地模拟请求，取消后 promise 会拒绝 */
export interface PagingRequest {
  promise: Promise<PagingArticle[]>
  cancel: () => void
}

/** 创建独立的数据源；失败场景只在目标页首次完成请求时触发一次 */
export function createPagingSource(scenario: PagingScenario = 'normal') {
  let hasFailed = false

  function request(query: PagingQuery): PagingRequest {
    let cancel = () => {}
    const promise = new Promise<PagingArticle[]>((resolve, reject) => {
      const timer = setTimeout(() => {
        const shouldFail = !hasFailed && (
          (scenario === 'first-error' && query.pageNo === 1)
          || (scenario === 'more-error' && query.pageNo === 2)
        )
        if (shouldFail) {
          hasFailed = true
          reject(new Error('本次为模拟加载失败，请重试'))
          return
        }

        const keyword = query.keyword?.trim().toLowerCase() ?? ''
        const filtered = scenario === 'empty'
          ? []
          : pagingArticles.filter(article =>
              (!query.category || query.category === '全部' || article.category === query.category)
              && (!keyword || `${article.title} ${article.summary} ${article.category}`.toLowerCase().includes(keyword)),
            )
        const start = (query.pageNo - 1) * query.pageSize
        resolve(filtered.slice(start, start + query.pageSize))
      }, pagingDelay)

      cancel = () => {
        clearTimeout(timer)
        reject(new Error('分页示例请求已取消'))
      }
    })

    return { promise, cancel: () => cancel() }
  }

  return { request }
}
