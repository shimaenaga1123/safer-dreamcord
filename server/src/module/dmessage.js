import { calculatePP } from './performance';
import * as cheerio from 'cheerio';

export async function buildSolvedMessage(challengeId, solver, test = false) {
  let challengeInfo = null;

  try {
    const response = await fetch(`https://dreamhack.io/api/v1/wargame/challenges/${challengeId}/`);
    if (response.ok) {
      challengeInfo = await response.json();
    } else {
      throw Error(JSON.stringify(response));
    }
  } catch (error) {
    console.error('문제 정보 가져오기 실패:', error);
    return;
  }

  let valid = challengeInfo && solver;
  const rate = valid ? challengeInfo.cnt_solvers / challengeInfo.hitcount * 100 : 'N/A';
  const level_color = 1 <= challengeInfo.difficulty && challengeInfo.difficulty <= 3 ? 0x43B581 :
                      4 <= challengeInfo.difficulty && challengeInfo.difficulty <= 6 ? 0x09BAF9 :
                      7 <= challengeInfo.difficulty && challengeInfo.difficulty <= 8 ? 0x013CC7 :
                      9 === challengeInfo.difficulty ? 0xFC4749 :
                      10 === challengeInfo.difficulty ? 0xC90002 :
                      0xFFFFFF;

  const pp = calculatePP(challengeInfo);
  valid = pp ? valid : false;

  let nickname, introduction, profile_image;
  try {
    const response = await fetch(`https://dreamhack.io/users/${solver}`);
    if (!response.ok) {
      throw Error(JSON.stringify(response));
    }
    const $ = cheerio.load(await response.text(), 'text/html');
    const profile = $('.user-profile');
    nickname = profile.find('.nickname').text().trim().replace('`', "'");
    introduction = profile.find('.intro-text').text().trim().replace('`', "'");
    profile_image = profile.find('.user-icon > span > img').attr('src');
  } catch (error) {
    console.error(error);
    return;
  }

  if(!valid){
    console.error(solver, pp);
  }

  return {
    content: "",
    embeds: [{
      title: valid ? `🎉 ${challengeInfo.title} 문제 해결!` : `🎉 Challenge #${challengeId} 문제 해결!`,
      description: valid ?
        `**해결자**\n` + `[\`${nickname}\`](https://dreamhack.io/users/${solver})` +
        (introduction !== "아직 자기소개가 없습니다." ? ` | \`${introduction}\`\n\n` : '\n\n') +
        `**난이도**\n` + `LEVEL ${challengeInfo.difficulty}\n\n` +
        `**태그**\n` + `${challengeInfo.tags.map(tag => `#${tag}`).join(', ')}\n\n` +
        `**솔버 수**\n` + `${challengeInfo.cnt_solvers} solved / ${challengeInfo.hitcount} viewed` + (rate < 2 ? ` **(${rate.toFixed(2)}%)**\n\n` : ` (${rate.toFixed(2)}%)\n\n`) +
        `**예상되는 퍼포먼스**\n${pp.toFixed(2)}pp` + (test ? `\n\n*이 메시지는 웹훅 테스트 메시지이며, 실제로 풀이된 것이 아닙니다.*` : '')
        :
        `Challenge #${challengeId}를 해결했습니다!` + (test ? `\n\n*이 메시지는 웹훅 테스트 메시지이며, 실제로 풀이된 것이 아닙니다.*` : ''),
      color: level_color,
      url: `https://dreamhack.io/wargame/challenges/${challengeId}`,
      timestamp: new Date().toISOString(),

      // It is safe to use the raw solver input object because Dreamhack and Discord will block exploits.
      ...(solver ? { thumbnail: { url: profile_image || 'https://static.dreamhack.io/main/v2/img/amo.1a05d65.png' } } : {}),
    }]
  };
}