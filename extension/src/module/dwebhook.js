import * as cheerio from "cheerio";

async function send(webhookUrl, challengeId, solver, test) {
	try {
		const response = await fetch(webhookUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ challenge_id: challengeId, solver, test }),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		if (test) {
			const data = await response.json();
			return validateMessage(data, solver, challengeId);
		}

		return { success: true };
	} catch (error) {
		console.error("Discord webhook 전송 실패:", error);
		return { success: false, error: error.message };
	}
}

function validateMessage(message, expectedSolver, expectedChallengeId) {
	try {
		if (!message || typeof message !== "object") {
			return { success: false, error: "메시지 형식이 올바르지 않습니다." };
		}

		if (
			!message.embeds ||
			!Array.isArray(message.embeds) ||
			message.embeds.length === 0
		) {
			return { success: false, error: "embeds 배열이 없거나 비어있습니다." };
		}

		const embed = message.embeds[0];
		const requiredFields = [
			"title",
			"description",
			"color",
			"url",
			"timestamp",
			"thumbnail",
		];

		for (const field of requiredFields) {
			if (!embed[field]) {
				return { success: false, error: `필수 필드 '${field}'가 없습니다.` };
			}
		}

		if (!embed.thumbnail.url) {
			return { success: false, error: "thumbnail.url이 없습니다." };
		}

		if (
			typeof embed.color !== "number" ||
			embed.color < 0 ||
			embed.color > 0xffffff
		) {
			return { success: false, error: "색상 값이 올바르지 않습니다." };
		}

		const urlMatch = embed.url.match(/challenges\/(\d+)/);
		if (!urlMatch || parseInt(urlMatch[1], 10) !== expectedChallengeId) {
			return {
				success: false,
				error: `Challenge ID가 일치하지 않습니다. (기대: ${expectedChallengeId}, 실제: ${urlMatch?.[1] || "Unknown"})`,
			};
		}

		const solverMatch = embed.description.match(
			/https:\/\/dreamhack\.io\/users\/(\d+)/,
		);
		if (!solverMatch) {
			return { success: false, error: "Solver ID를 찾을 수 없습니다." };
		}

		const actualSolver = parseInt(solverMatch[1], 10);
		if (actualSolver !== expectedSolver) {
			return {
				success: false,
				error: `Solver ID가 저장된 userid와 일치하지 않습니다. (저장된 userid: ${expectedSolver}, 응답의 solver: ${actualSolver})`,
			};
		}

		const difficultyMatch = embed.description.match(/LEVEL (\d+)/);
		const difficulty = difficultyMatch?.[1] || "Unknown";

		const nicknameMatch = embed.description.match(/\[`([^`]+)`\]/);
		const nickname = nicknameMatch?.[1] || "Unknown";

		return {
			success: true,
			message: "메시지 형식이 올바르며, userid가 일치합니다.",
			preview: {
				title: embed.title,
				difficulty: difficulty,
				nickname: nickname,
				solver: actualSolver,
			},
		};
	} catch (error) {
		return { success: false, error: `검증 중 오류 발생: ${error.message}` };
	}
}

export async function sendToAll(challengeId, test = false) {
	let solver = await chrome.storage.sync.get(["userid"]);
	solver = solver.userid;

	if (!solver) {
		try {
			const response = await fetch(`https://dreamhack.io/mypage`, {
				method: "GET",
			});
			if (response.ok) {
				const data = await response.text();
				const $ = cheerio.load(data);
				const element = $("a.field-nickname");
				if (element.length) {
					solver = parseInt(element.attr("href").split("/").pop(), 10);
					await chrome.storage.sync.set({ userid: solver });
				}
			} else {
				throw new Error(`Failed to fetch mypage, status: ${response.status}`);
			}
		} catch (error) {
			console.error("솔버 정보 가져오기 실패:", error);
			return { success: false, content: "Failed to fetch solver information" };
		}
	}

	try {
		const result = await chrome.storage.sync.get(["webhooks"]);
		const webhooks = result.webhooks || [];

		const promises = webhooks.map((webhook) =>
			send(webhook, parseInt(challengeId, 10), solver, test),
		);
		const results = await Promise.all(promises);

		if (test) {
			const failedResults = results.filter((r) => !r.success);

			if (failedResults.length > 0) {
				return {
					status: false,
					content: `검증 실패:\n${failedResults.map((r) => r.error).join("\n")}`,
				};
			}

			const preview = results[0]?.preview;
			return {
				status: true,
				content: results[0]?.message || "검증 성공",
				preview: preview,
			};
		}

		return { status: true };
	} catch (error) {
		console.error("Discord webhooks 전송 실패:", error);
		return { status: false, content: error.message || error };
	}
}
