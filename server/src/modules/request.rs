use crate::modules::types::*;
use anyhow::Result;
use once_cell::sync::Lazy;
use dom_query::Document;

static CLIENT: Lazy<reqwest::Client> = Lazy::new(|| {
    reqwest::Client::builder()
        .pool_max_idle_per_host(10)
        .gzip(true)
        .build()
        .unwrap()
});

pub async fn get_challenge(challenge_id: &u32) -> Result<ChallengeInfo> {
    let response = CLIENT
        .get(format!(
            "https://dreamhack.io/api/v1/wargame/challenges/{}/",
            challenge_id
        ))
        .send()
        .await?
        .error_for_status()?;

    Ok(response.json::<ChallengeInfo>().await?)
}

pub async fn get_user(user_id: &u32) -> Result<UserInfo> {
    let text = CLIENT
        .get(format!("https://dreamhack.io/users/{}", user_id))
        .send()
        .await?
        .error_for_status()?
        .text()
        .await?;

    let document = Document::from(text.as_str());

    let extract_text = |selector: &str| -> String {
        document
            .select(selector)
            .text()
            .to_string()
            .trim()
            .replace('`', "'")
    };

    let nickname = extract_text(".user-profile .nickname");
    let introduction = extract_text(".user-profile .intro-text");

    let profile_image = document
        .select(".user-profile .user-icon img")
        .attr("src")
        .map(|s| s.to_string())
        .unwrap_or_else(|| "https://static.dreamhack.io/main/v2/img/amo.1a05d65.png".to_string())
        .trim()
        .replace('`', "'");

    Ok(UserInfo {
        nickname,
        introduction,
        profile_image,
    })
}
