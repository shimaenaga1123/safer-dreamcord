import { sendToAll } from "../module/dwebhook.js";

if (chrome.webRequest?.onCompleted) {
	chrome.webRequest.onCompleted.addListener(
		async (details) => {
			if (
				details.url.includes("/api/v1/wargame/challenges/") &&
				details.url.includes("/auth/") &&
				details.method === "POST"
			) {
				const challengeId = details.url.match(/challenges\/(\d+)\/auth/)?.[1];
				if (!challengeId) return;

				if (details.statusCode >= 200 && details.statusCode < 300) {
					await sendToAll(challengeId);
				}
			}
		},
		{
			urls: ["https://dreamhack.io/api/v1/wargame/challenges/*/auth/"],
			types: ["xmlhttprequest"],
		},
	);
}
