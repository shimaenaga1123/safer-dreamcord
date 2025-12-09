import $ from "jquery";
import { sendToAll } from "../module/dwebhook.js";

// Promise 기반 storage API
const storage = {
	get: (keys) =>
		new Promise((resolve) => chrome.storage.sync.get(keys, resolve)),
	set: (items) =>
		new Promise((resolve) => chrome.storage.sync.set(items, resolve)),
	remove: (keys) =>
		new Promise((resolve) => chrome.storage.sync.remove(keys, resolve)),
};

$(() => {
	const $webhooksList = $("#webhooks-list");
	const $addWebhookButton = $("#add-webhook");
	const $statusMessage = $("#status-message");

	function showStatusMessage(message, isError = false) {
		if (isError) {
			$statusMessage.addClass("error");
		} else {
			$statusMessage.removeClass("error");
		}

		$statusMessage.text(message);
		$statusMessage.addClass("show");
		setTimeout(() => {
			$statusMessage.removeClass("show");
			$statusMessage.removeClass("error");
		}, 5000);
	}

	async function loadWebhooks() {
		const { webhooks = [] } = await storage.get(["webhooks"]);
		$webhooksList.html("");

		webhooks.forEach((webhook, index) => {
			addWebhookItem(webhook, index);
		});
	}

	function addWebhookItem(webhookUrl = "", _index) {
		const $webhookItem = $("<div>").addClass("webhook-item");
		$webhookItem.html(`
      <input type="text" class="webhook-url" placeholder="https://discord.com/api/webhooks/..." value="${webhookUrl}">
      <button class="save-button">저장</button>
      <button class="delete-button" style="display: ${webhookUrl ? "inline" : "none"}">×</button>
    `);

		const $input = $webhookItem.find(".webhook-url");
		const $saveButton = $webhookItem.find(".save-button");
		const $deleteButton = $webhookItem.find(".delete-button");

		let originalValue = $input.val();
		$input.on("input", () => {
			if ($input.val() !== originalValue) {
				$saveButton.addClass("modified");
			} else {
				$saveButton.removeClass("modified");
			}
		});

		$saveButton.on("click", async () => {
			const { webhooks = [] } = await storage.get(["webhooks"]);
			const currentIndex = $webhooksList.children().index($webhookItem);
			webhooks[currentIndex] = $input.val();
			await storage.set({ webhooks });

			showStatusMessage("웹훅이 저장되었습니다!");
			$deleteButton.css("display", "inline");
			originalValue = $input.val();
			$saveButton.removeClass("modified");
		});

		$deleteButton.on("click", async () => {
			const { webhooks = [] } = await storage.get(["webhooks"]);
			const currentIndex = $webhooksList.children().index($webhookItem);
			webhooks.splice(currentIndex, 1);
			await storage.set({ webhooks });

			showStatusMessage("웹훅이 삭제되었습니다.", true);
			loadWebhooks();
		});

		$webhooksList.append($webhookItem);
	}

	$addWebhookButton.on("click", async () => {
		const { webhooks = [] } = await storage.get(["webhooks"]);
		addWebhookItem("", webhooks.length);
	});

	loadWebhooks();

	const $debugButton = $("#debug-test");
	const $debugInput = $("#debug-challenge-id");

	$debugButton.on("click", async () => {
		const challengeId = $debugInput.val();
		if (!challengeId) {
			showStatusMessage("Challenge ID를 입력해주세요.", true);
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

	const $clearUserInfoButton = $("#clear-user-info");
	$clearUserInfoButton.on("click", async () => {
		await storage.remove(["userid"]);
		showStatusMessage("사용자 정보가 삭제되었습니다.", true);
	});
});
