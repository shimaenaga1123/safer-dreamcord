async function send(webhookUrl, challengeId, solver, test) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({challengeId, solver, test})
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

  let solver = null;
  try {
    const response = await fetch(`https://dreamhack.io/api/v1/wargame/challenges/${challengeId}/solvers/?limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      const data = await response.json();
      solver = data.results[0].user.id;
    } else {
      throw Error(JSON.stringify(response));
    }
  } catch (error) {
    console.error('솔버 정보 가져오기 실패:', error);
  }

  try {
    const result = await browserAPI.storage.sync.get(['webhooks']);
    const webhooks = result.webhooks || [];

    const promises = webhooks.map(webhook => send(webhook, challengeId, solver, test));
    await Promise.all(promises);

    return {status: true};
  } catch (error) {
    console.error('Discord webhooks 전송 실패:', error);
    return {status: false, content: error};
  }
}
