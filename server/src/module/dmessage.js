import { calculatePP } from './performance';

export async function buildSolvedMessage(challengeId, player, test = false) {
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
  }

  let valid = challengeInfo && player;
  const rate = valid ? challengeInfo.cnt_solvers / challengeInfo.hitcount * 100 : 'N/A';
  const level_color = 1 <= challengeInfo.difficulty && challengeInfo.difficulty <= 3 ? 0x43B581 :
                      4 <= challengeInfo.difficulty && challengeInfo.difficulty <= 6 ? 0x09BAF9 :
                      7 <= challengeInfo.difficulty && challengeInfo.difficulty <= 8 ? 0x013CC7 :
                      9 === challengeInfo.difficulty ? 0xFC4749 :
                      10 === challengeInfo.difficulty ? 0xC90002 :
                      0xFFFFFF;

  const pp = calculatePP(challengeInfo);
  valid = pp ? valid : false;

  // idk who will exploit this, but it's better to be safe than sorry.
  player.introduction = player.introduction.replace('`', "'");
  player.nickname = player.nickname.replace('`', "'");

  if(!valid){
    console.error(player, pp);
  }

  return {
    content: "",
    embeds: [{
      title: valid ? `🎉 ${challengeInfo.title} 문제 해결!` : `🎉 Challenge #${challengeId} 문제 해결!`,
      description: valid ?
        `**해결자**\n` + `[\`${player.nickname}\`](https://dreamhack.io/users/${player.id})` +
        (player.introduction ? ` | \`${player.introduction}\`\n\n` : '\n\n') +
        `**난이도**\n` + `LEVEL ${challengeInfo.difficulty}\n\n` +
        `**태그**\n` + `${challengeInfo.tags.map(tag => `#${tag}`).join(', ')}\n\n` +
        `**솔버 수**\n` + `${challengeInfo.cnt_solvers} solved / ${challengeInfo.hitcount} viewed` + (rate < 2 ? ` **(${rate.toFixed(2)}%)**\n\n` : ` (${rate.toFixed(2)}%)\n\n`) +
        `**예상되는 퍼포먼스**\n${pp.toFixed(2)}pp` + (test ? `\n\n*이 메시지는 웹훅 테스트 메시지이며, 실제로 풀이된 것이 아닙니다.*` : '')
        :
        `Challenge #${challengeId}를 해결했습니다!` + (test ? `\n\n*이 메시지는 웹훅 테스트 메시지이며, 실제로 풀이된 것이 아닙니다.*` : ''),
      color: level_color,
      url: `https://dreamhack.io/wargame/challenges/${challengeId}`,
      timestamp: new Date().toISOString(),

      // It is safe to use the raw player input object because Dreamhack and Discord will block exploits.
      ...(player ? { thumbnail: { url: player.profile_image || 'https://static.dreamhack.io/main/v2/img/amo.1a05d65.png' } } : {}),
    }]
  };
}