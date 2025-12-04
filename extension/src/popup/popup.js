import { sendToAll } from '../module/dwebhook.js';

const browserAPI = chrome; // chrome || browser || window.browser || window.chrome;

document.addEventListener('DOMContentLoaded', () => {
  const webhooksList = document.getElementById('webhooks-list');
  const addWebhookButton = document.getElementById('add-webhook');
  const statusMessage = document.getElementById('status-message');

  function showStatusMessage(message, isError = false) {
    if (isError) {
      statusMessage.classList.add('error');
    } else {
      statusMessage.classList.remove('error');
    }

    statusMessage.textContent = message;
    statusMessage.classList.add('show');
    setTimeout(() => {
      statusMessage.classList.remove('show');
      statusMessage.classList.remove('error');
    }, 2000);
  }

  function loadWebhooks() {
    browserAPI.storage.sync.get(['webhooks'], (result) => {
      webhooksList.innerHTML = '';
      const webhooks = result.webhooks || [];

      webhooks.forEach((webhook, index) => {
        addWebhookItem(webhook, index);
      });
    });
  }

  function addWebhookItem(webhookUrl = '', index) {
    const webhookItem = document.createElement('div');
    webhookItem.className = 'webhook-item';
    webhookItem.innerHTML = `
      <input type="text" class="webhook-url" placeholder="https://discord.com/api/webhooks/..." value="${webhookUrl}">
      <button class="save-button">저장</button>
      <button class="delete-button" style="display: ${webhookUrl ? 'inline' : 'none'}">×</button>
    `;

    const input = webhookItem.querySelector('.webhook-url');
    const saveButton = webhookItem.querySelector('.save-button');
    const deleteButton = webhookItem.querySelector('.delete-button');

    let originalValue = input.value;
    input.addEventListener('input', () => {
      if (input.value !== originalValue) {
        saveButton.classList.add('modified');
      } else {
        saveButton.classList.remove('modified');
      }
    });

    saveButton.addEventListener('click', () => {
      browserAPI.storage.sync.get(['webhooks'], (result) => {
        const webhooks = result.webhooks || [];
        const currentIndex = Array.from(webhooksList.children).indexOf(webhookItem);
        webhooks[currentIndex] = input.value;
        browserAPI.storage.sync.set({ webhooks }, () => {
          showStatusMessage('웹훅이 저장되었습니다!');
          deleteButton.style.display = 'inline';
          originalValue = input.value;
          saveButton.classList.remove('modified');
        });
      });
    });

    deleteButton.addEventListener('click', () => {
      browserAPI.storage.sync.get(['webhooks'], (result) => {
        const webhooks = result.webhooks || [];
        const currentIndex = Array.from(webhooksList.children).indexOf(webhookItem);
        webhooks.splice(currentIndex, 1);
        browserAPI.storage.sync.set({ webhooks }, () => {
          showStatusMessage('웹훅이 삭제되었습니다.', true);
          loadWebhooks();
        });
      });
    });

    webhooksList.appendChild(webhookItem);
  }

  addWebhookButton.addEventListener('click', () => {
    browserAPI.storage.sync.get(['webhooks'], (result) => {
      const webhooks = result.webhooks || [];
      addWebhookItem('', webhooks.length);
    });
  });

  loadWebhooks();

  // 개발용 디버그 기능
  const debugButton = document.getElementById('debug-test');
  const debugInput = document.getElementById('debug-challenge-id');

  debugButton?.addEventListener('click', async () => {
    const challengeId = debugInput.value;
    if (!challengeId) {
      showStatusMessage('Challenge ID를 입력해주세요.', true);
      return;
    }

    try {
      const result = await sendToAll(challengeId, true);

      if (result.status) {
        let message = result.content;
        if (result.preview) {
          message += `\n제목: ${result.preview.title}\n난이도: LEVEL ${result.preview.difficulty}\n닉네임: ${result.preview.nickname}`;
        }
        showStatusMessage(message);
      } else {
        showStatusMessage(`검증 실패: ${result.content}`, true);
      }
    } catch (error) {
      showStatusMessage(`오류 발생: ${error}`, true);
    }
  });

  const clearUserInfoButton = document.getElementById('clear-user-info');
  clearUserInfoButton?.addEventListener('click', async () => {
    await browserAPI.storage.sync.remove(['userid']);
    showStatusMessage('사용자 정보가 삭제되었습니다.', true);
  });
});
