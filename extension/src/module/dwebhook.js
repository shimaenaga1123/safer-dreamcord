async function send(webhookUrl, challengeId, solver, test) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({challenge_id: challengeId, solver, test})
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Discord webhook 전송 실패:', error);
    return false;
  }
}

export async function sendToAll(challengeId, test = false) {
  const browserAPI = chrome;

  let solver = await browserAPI.storage.sync.get(['userid']);
  solver = solver.userid;

  if (!solver) {
    try {
      const response = await fetch(`https://dreamhack.io/mypage`, {
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        const element = doc.querySelector('a.field-nickname');
        if (element) {
          solver = parseInt(element.getAttribute('href').split('/').pop(), 10);
          await browserAPI.storage.sync.set({userid: solver});
        }
      } else {
        throw Error(JSON.stringify(response));
      }
    } catch (error) {
      console.error('솔버 정보 가져오기 실패:', error);
    }
  }

  try {
    const result = await browserAPI.storage.sync.get(['webhooks']);
    const webhooks = result.webhooks || [];

    const promises = webhooks.map(webhook => send(webhook, parseInt(challengeId, 10), solver, test));
    await Promise.all(promises);

    return {status: true};
  } catch (error) {
    console.error('Discord webhooks 전송 실패:', error);
    return {status: false, content: error};
  }
}
