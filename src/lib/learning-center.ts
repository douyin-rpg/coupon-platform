/**
 * 抖音电商学习中心 - 静态课程数据
 * 内容整理自官方学习中心 https://school.jinritemai.com/doudian/web/home
 */

export interface LearningCourse {
  title: string;
  url: string;
  learners: string; // 学习人数（万）
  rating?: string; // 评分（如有）
  lessons?: string; // 课时数（系列课程）
  tag: string; // 所属板块
}

export interface LearningGroup {
  key: string;
  title: string;
  emoji: string;
  gradient: string; // tailwind gradient classes
  desc: string;
  courses: LearningCourse[];
}

/** 新商成长路径 */
export const newSellerCourses: LearningCourse[] = [
  { title: '💡抖音电商入驻全流程，2分钟搞懂！', url: 'https://school.jinritemai.com/doudian/web/video-article/vJcUKiheSr41?biz_from=新商-了解平台', learners: '150.1万', rating: '4.7', tag: '了解平台' },
  { title: '【一图读懂】新商权益焕新指南', url: 'https://school.jinritemai.com/doudian/web/article/aJeCWdeSehCW?biz_from=新商-了解平台', learners: '37.6万', rating: '4.8', tag: '了解平台' },
  { title: '中小商家掘金36计-【抖店入驻篇】了解&下载「抖店」，掌握基础操作', url: 'https://school.jinritemai.com/doudian/web/article/aJnx44j7K4gs?biz_from=新商-了解平台', learners: '2.5万', tag: '开店指南' },
  { title: '💰低成本学抖店操作，技巧一键会', url: 'https://school.jinritemai.com/doudian/web/video-article/vJcUKiheTBXw?biz_from=新商-了解平台', learners: '70.5万', tag: '开店指南' },
  { title: '📈新商发品享体验分！至高 70 分', url: 'https://school.jinritemai.com/doudian/web/course-series/cJcZP9wGXKQN?biz_from=新商-了解平台', learners: '33.4万', lessons: '10节课', tag: '开店指南' },
  { title: '千川乘方是什么？认识千川乘方', url: 'https://school.jinritemai.com/doudian/web/article/aJr9DTknpLT6?biz_from=新商-了解平台', learners: '1.6万', tag: '了解平台' },
  { title: '新商家必看｜11大权益助力生意爆发（权益一～四）', url: 'https://school.jinritemai.com/doudian/web/article/aJsNhb82Au31?biz_from=新商-了解平台', learners: '4342', tag: '爆单秘籍' },
  { title: '新商家抖店经营『通关攻略』', url: 'https://school.jinritemai.com/doudian/web/article/aJYzkpyKyVTf?biz_from=开单攻略', learners: '56.8万', rating: '4.8', tag: '开单攻略' },
  { title: '新商家冷启出单必修课', url: 'https://school.jinritemai.com/doudian/web/course-series/cJRbRRvro6kx?biz_from=开单攻略', learners: '81.8万', lessons: '6节课', tag: '开单攻略' },
  { title: '新商冷启篇｜如何让更多商品实现动销', url: 'https://school.jinritemai.com/doudian/web/course-series/cJXkSAvLaXtJ?biz_from=爆款打造', learners: '41.2万', lessons: '视频课程', tag: '爆单秘籍' },
  { title: '新商冷启篇｜如何在商机中心发布商品', url: 'https://school.jinritemai.com/doudian/web/course-series/cJXhsGWHWoYT?biz_from=新品运营', learners: '35.3万', lessons: '视频课程', tag: '爆单秘籍' },
  { title: '新商冷启篇｜如何配置营销工具', url: 'https://school.jinritemai.com/doudian/web/course-series/cJXhsGWHWU4X?biz_from=营销工具', learners: '36.7万', lessons: '视频课程', tag: '爆单秘籍' },
  { title: '新商冷启篇｜如何获得商品好评', url: 'https://school.jinritemai.com/doudian/web/course-series/cJXevBQVwRAi?biz_from=营销工具', learners: '27.6万', lessons: '视频课程', tag: '爆单秘籍' },
  { title: '【一图读懂】💡新店起量秘籍', url: 'https://school.jinritemai.com/doudian/web/article/aJdJWYgiqrGj?biz_from=流量获取技巧榜', learners: '95.4万', tag: '数据复盘' },
  { title: 'AI智能成片-商家操作指南', url: 'https://school.jinritemai.com/doudian/web/article/aJco8mraoFXH?biz_from=流量获取技巧榜', learners: '48.1万', rating: '4.8', tag: '数据复盘' },
  { title: '巨量千川「全域推商品-全店托管」投放指南', url: 'https://school.jinritemai.com/doudian/web/article/aJdBXwK4D7j9?biz_from=流量获取技巧榜', learners: '31.3万', rating: '4.8', tag: '数据复盘' },
];

/** 达人成长路径 */
export const talentCourses: LearningCourse[] = [
  { title: '抖音电商创作者等级管理规则', url: 'https://school.jinritemai.com/doudian/web/article/aHRbnsP5fSGu?biz_from=达人须知', learners: '316.8万', rating: '4.8', tag: '达人须知' },
  { title: '新达人必知规则', url: 'https://school.jinritemai.com/doudian/web/video-article/vHttnPqXKuU7?biz_from=达人须知', learners: '58.7万', rating: '4.9', tag: '达人须知' },
  { title: '行业高频违规白皮书', url: 'https://school.jinritemai.com/doudian/web/course-series/cJae55Zn4rfy?biz_from=达人须知', learners: '39.7万', rating: '4.5', tag: '达人须知' },
  { title: '虚假宣传规则解读白皮书', url: 'https://school.jinritemai.com/doudian/web/article/aJb3vD79JS1W?biz_from=达人须知', learners: '82.9万', rating: '4.8', tag: '达人须知' },
  { title: '🤝双佣金：解锁低佣投流新效率，引爆达人合作增量', url: 'https://school.jinritemai.com/doudian/web/article/aJbDk7r3CVX1?biz_from=达人合作', learners: '12.6万', rating: '4.6', tag: '达人合作' },
  { title: '乘方✖️达人营销升级，帮你提高效率拿增量', url: 'https://school.jinritemai.com/doudian/web/article/aJqjc7VqosiJ?biz_from=达人合作', learners: '4.6万', tag: '达人合作' },
  { title: 'T+S商单任务商家使用手册', url: 'https://school.jinritemai.com/doudian/web/lark-doc/fdJhpQNgq5WQh?biz_from=达人合作', learners: '3006', tag: '达人合作' },
  { title: '双11爆品还没在精选联盟发布？曝光机会别错过', url: 'https://school.jinritemai.com/doudian/web/article/aJsKYbh2Np1Y?biz_from=达人合作', learners: '1.2万', tag: '选品技巧' },
];

/** 经营实操精选 */
export const operationCourses: LearningCourse[] = [
  { title: '应季上新品直击用户需求，livehead短视频精准引流推动高转化【中小商家案例】', url: 'https://school.jinritemai.com/doudian/web/article/aJb9xvjXh4CX?biz_from=优质经营案例榜', learners: '48.9万', tag: '经营案例' },
  { title: '热门品类铺货优化商品信息，报名大促及成长任务加速新店生意冷启动【中小商家案例-商家成长】', url: 'https://school.jinritemai.com/doudian/web/article/aJMJV6YyTaru?biz_from=优质经营案例榜', learners: '25.3万', rating: '4.7', tag: '经营案例' },
  { title: '优化商品货盘精准匹配消费需求，强化直播间信任促成高效转化【中小商家案例】', url: 'https://school.jinritemai.com/doudian/web/article/aJaGhvENJo26?biz_from=优质经营案例榜', learners: '63.9万', rating: '4.9', tag: '经营案例' },
  { title: '5分钟玩转AIGC，一键生成爆量内容【短视频】', url: 'https://school.jinritemai.com/doudian/web/article/aJjFcXhjd1zB?biz_from=爆单秘籍', learners: '52.3万', tag: '短视频运营' },
  { title: '双11抢跑必看！大促全域经营爆发指南', url: 'https://school.jinritemai.com/doudian/web/article/aJr9FPmu21Sk?biz_from=爆单秘籍', learners: '2.7万', tag: '大促指南' },
  { title: '双11如何高效备货？大促商品策略一页通', url: 'https://school.jinritemai.com/doudian/web/article/aJr9FPLBwHoU?biz_from=爆单秘籍', learners: '2.1万', tag: '大促指南' },
  { title: '小店也能"大爆发"｜双11大促全周期实战地图', url: 'https://school.jinritemai.com/doudian/web/article/aJrRexZ9pWcW?biz_from=爆单秘籍', learners: '1.5万', tag: '大促指南' },
  { title: '优质素材标准下，各行业商家怎样做好「千川素材」？', url: 'https://school.jinritemai.com/doudian/web/course-series/cJnEzXyPzqcq?biz_from=千川投放', learners: '20.7万', lessons: '2节课', tag: '千川投放' },
  { title: '【中小商家】千川投放提效爆发 商家案例合集', url: 'https://school.jinritemai.com/doudian/web/course-series/cJnLCP8smTAM?biz_from=千川投放', learners: '17.0万', lessons: '3节课', tag: '千川投放' },
  { title: '不知道怎么做好投放？手把手带你轻松玩转巨量千川！', url: 'https://school.jinritemai.com/doudian/web/course-series/cJRCSqPkhJx2?biz_from=千川投放', learners: '75.2万', lessons: '7节课', tag: '千川投放' },
  { title: '蓄力双11！中小商家短视频爆发指南', url: 'https://school.jinritemai.com/doudian/web/article/aJrPUuzZbDE6?biz_from=短视频运营', learners: '2.6万', tag: '短视频运营' },
  { title: '短视频运营篇｜如何提升短视频发布数量', url: 'https://school.jinritemai.com/doudian/web/course-series/cJWYT44FTmVB?biz_from=短视频运营', learners: '39.1万', lessons: '视频课程', tag: '短视频运营' },
  { title: '一次学懂！中小商家短视频运营全流程秘籍', url: 'https://school.jinritemai.com/doudian/web/course-series/cJnHgkiHcTKT?biz_from=短视频运营', learners: '9.5万', lessons: '4节课', tag: '短视频运营' },
  { title: '短视频运营篇｜如何让短视频获取更多流量', url: 'https://school.jinritemai.com/doudian/web/course-series/cJXKrNoJztZf?biz_from=短视频运营', learners: '29.4万', lessons: '视频课程', tag: '短视频运营' },
  { title: '借力团长分销与千川乘方，节日商品实现应季增长', url: 'https://school.jinritemai.com/doudian/web/article/aJsayXFR6QZp?biz_from=爆款打造', learners: '8646', tag: '爆款打造' },
  { title: '【中小商家】实拍短视频突出爆品优势，联盟达人放大+投放拉动投资回报率爆发', url: 'https://school.jinritemai.com/doudian/web/article/aJnmFhugJcaC?biz_from=爆款打造', learners: '13.3万', tag: '爆款打造' },
  { title: '短视频表达多爆品货盘优势，达人投放+货架场承接增长【中小商家案例】', url: 'https://school.jinritemai.com/doudian/web/article/aJoJC43jEVTj?biz_from=爆款打造', learners: '5.4万', tag: '爆款打造' },
  { title: '双11直播爆量作战卡：踩准大促节奏，抢占流量先机！', url: 'https://school.jinritemai.com/doudian/web/article/aJr9GykWBAYK?biz_from=直播运营', learners: '2.1万', tag: '直播运营' },
  { title: '直播运营篇｜如何提升直播时长和效果', url: 'https://school.jinritemai.com/doudian/web/course-series/cJWYPnaWm45V?biz_from=直播运营', learners: '37.4万', lessons: '视频课程', tag: '直播运营' },
  { title: '直播运营入门必修课', url: 'https://school.jinritemai.com/doudian/web/course-series/cJRGFPQRKb6E?biz_from=直播运营', learners: '59.4万', lessons: '6节课', tag: '直播运营' },
  { title: '直播运营进阶课 直播数据诊断优化攻略', url: 'https://school.jinritemai.com/doudian/web/course-series/cJRy5tAmL5RU?biz_from=直播运营', learners: '33.0万', lessons: '视频课程', tag: '直播运营' },
  { title: '高频日播沉淀自然流，"短直"联动+千川投放高效拉升GMV【中小商家案例】', url: 'https://school.jinritemai.com/doudian/web/article/aJmY9jSEHDNg?biz_from=开单攻略', learners: '17.3万', tag: '经营案例' },
  { title: '商城运营应该怎么做', url: 'https://school.jinritemai.com/doudian/web/course-series/cHhncbH3UJoL?biz_from=商城运营', learners: '32.9万', lessons: '2节课', tag: '商城运营' },
  { title: '商城推荐（猜你喜欢）运营三要素', url: 'https://school.jinritemai.com/doudian/web/course-series/cHj8Q9DGwZBP?biz_from=商城运营', learners: '46.0万', lessons: '2节课', tag: '商城运营' },
  { title: '货架运营入门必修课', url: 'https://school.jinritemai.com/doudian/web/course-series/cJTbruihcTQL?biz_from=商城运营', learners: '38.8万', lessons: '4节课', tag: '商城运营' },
  { title: '货架运营进阶课 货架流量优化攻略', url: 'https://school.jinritemai.com/doudian/web/course-series/cJbuCg7FKW77?biz_from=商城运营', learners: '35.6万', lessons: '6节课', tag: '商城运营' },
  { title: '如何报名源头好货活动', url: 'https://school.jinritemai.com/doudian/web/video-article/vJbwUFUAnPeu?biz_from=营销工具', learners: '38.9万', rating: '4.8', tag: '营销工具' },
  { title: '如何进行长周期活动报名', url: 'https://school.jinritemai.com/doudian/web/video-article/vJbrt3rrkE4q?biz_from=营销工具', learners: '49.2万', rating: '4.8', tag: '营销工具' },
  { title: '抖音电商搜索运营三要素，助搜索GMV提升', url: 'https://school.jinritemai.com/doudian/web/article/aHcu2P37hHgK?biz_from=搜索运营', learners: '71.2万', rating: '4.7', tag: '搜索运营' },
  { title: '电商方法论｜搜索运营五要素', url: 'https://school.jinritemai.com/doudian/web/course-series/cHrpffcd66vT?biz_from=搜索运营', learners: '31.0万', lessons: '视频课程', tag: '搜索运营' },
  { title: '搜索运营入门必修课', url: 'https://school.jinritemai.com/doudian/web/course-series/cJbrkaixAfCe?biz_from=搜索运营', learners: '37.6万', lessons: '6节课', tag: '搜索运营' },
  { title: '优化商品搜索曝光和转化率', url: 'https://school.jinritemai.com/doudian/web/video-article/vJN7pCf3VfFQ?biz_from=搜索运营', learners: '17.0万', rating: '4.6', tag: '搜索运营' },
  { title: '丰富商品篇｜如何上架更多新品', url: 'https://school.jinritemai.com/doudian/web/course-series/cJWYPnaX5ww1?biz_from=新品运营', learners: '39.6万', lessons: '视频课程', tag: '新品运营' },
  { title: '如何新增站外主营类目商品', url: 'https://school.jinritemai.com/doudian/web/video-article/vJbuWpz5enE5?biz_from=新品运营', learners: '28.1万', rating: '4.8', tag: '新品运营' },
  { title: '千川自助服饰【新潮新品】推荐标签--运营指南', url: 'https://school.jinritemai.com/doudian/web/article/aJXYLhiEqtoK?biz_from=新品运营', learners: '43.6万', rating: '4.7', tag: '新品运营' },
];

/** 学习中心分组展示配置 */
export const learningGroups: LearningGroup[] = [
  {
    key: 'new-seller',
    title: '新商成长',
    emoji: '🚀',
    gradient: 'from-blue-500 to-cyan-400',
    desc: '从入驻到爆单，新商家五步成长路径（了解平台 / 开店指南 / 开单攻略 / 爆单秘籍 / 数据复盘）',
    courses: newSellerCourses,
  },
  {
    key: 'talent',
    title: '达人必修',
    emoji: '🌟',
    gradient: 'from-fuchsia-500 to-pink-400',
    desc: '达人须知 / 多体裁经营 / 选品技巧 / 获取流量 / 营销工具，五类达人核心课程',
    courses: talentCourses,
  },
  {
    key: 'operation',
    title: '经营实操',
    emoji: '🎯',
    gradient: 'from-amber-500 to-orange-400',
    desc: '千川投放 / 短视频运营 / 直播运营 / 商城运营 / 搜索运营等全场景实战技巧',
    courses: operationCourses,
  },
];

/** 官方学习中心首页 */
export const officialHomeUrl = 'https://school.jinritemai.com/doudian/web/home?btm_pre=a1032.b72953.c6917.d9327&btm_show_id=a34ae828-1f4a-4c94-a77b-afe456f52e60&btm_ppre=a0.b0.c0.d0&from=shop_adtable';