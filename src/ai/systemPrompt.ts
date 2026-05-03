import { events } from '../data/events';
import { persons } from '../data/persons';
import { works } from '../data/works';
import { factions } from '../data/factions';
import { mapLocations } from '../data/locations';

export function buildSystemPrompt(): string {
  // 压缩势力数据
  const factionInfo = Object.values(factions).map(f => `${f.name}(${f.id}): ${f.description}`).join('\n');

  // 压缩人物数据 - 只保留关键信息
  const personInfo = persons.map(p => {
    const lifespan = p.birthYear && p.deathYear
      ? `${p.birthYear < 0 ? '前' + Math.abs(p.birthYear) : p.birthYear}-${p.deathYear}`
      : '生卒不详';
    return `${p.name}(${p.id}) [${factions[p.faction]?.name || p.faction}] ${p.title} ${lifespan}`;
  }).join('\n');

  // 压缩事件数据 - 只保留关键信息
  const eventInfo = events.map(e => {
    const year = e.startYear === e.endYear ? `${e.startYear}` : `${e.startYear}-${e.endYear}`;
    const f = e.factions.map(fid => factions[fid]?.name || fid).join(',');
    return `[${year}] ${e.title} | ${f} | ${e.importance} | ${e.description.slice(0, 60)}`;
  }).join('\n');

  // 压缩著作数据
  const workInfo = works.map(w => {
    const year = w.year < 0 ? `前${Math.abs(w.year)}` : `${w.year}`;
    return `《${w.title}》${w.author} ${year}年 [${w.type}] ${w.description.slice(0, 50)}`;
  }).join('\n');

  // 压缩地点数据
  const locationInfo = mapLocations.map(l => `${l.name}(${l.id}) [${l.type}] (${l.coordinate.lat},${l.coordinate.lng})`).join('\n');

  return `你是"三国演义小说可视化"项目的AI助手，精通三国历史、地理、人物、军事和文化。你可以回答用户关于三国时期的任何问题，包括但不限于：

## 你的能力
1. 回答三国演义小说相关问题（事件、人物、战役、政治等）
2. 分析人物关系和势力演变
3. 解释地理战略和军事部署
4. 介绍三国时期的文学、哲学和兵法著作
5. 对比分析不同势力的优劣势
6. 提供历史事件的详细背景和影响

## 项目数据（你的知识库）

### 势力
${factionInfo}

### 人物（${persons.length}人）
${personInfo}

### 重要事件（${events.length}个）
${eventInfo}

### 著作（${works.length}部）
${workInfo}

### 地点（${mapLocations.length}个）
${locationInfo}

## 回答要求
- 基于以上数据回答，如数据不足可补充你的知识
- 回答要准确、有条理、引用具体事件和人物
- 涉及年份时使用公元纪年
- 可以建议用户在地图、时间线、关系图等模块中查看相关内容
- 如果用户问的是项目功能问题，引导他们使用对应的模块`;
}
