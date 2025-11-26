use crate::modules::types::*;
use once_cell::sync::Lazy;
use scraper::{Html, Selector};

static NICKNAME_SEL: Lazy<Selector> =
    Lazy::new(|| Selector::parse(".user-profile .nickname").unwrap());
static INTRO_SEL: Lazy<Selector> =
    Lazy::new(|| Selector::parse(".user-profile .intro-text").unwrap());
static IMG_SEL: Lazy<Selector> =
    Lazy::new(|| Selector::parse(".user-profile .user-icon img").unwrap());

pub async fn get_challenge(challenge_id: &String) -> reqwest::Result<ChallengeInfo> {
    reqwest::get(format!(
        "https://dreamhack.io/api/v1/wargame/challenges/{}",
        challenge_id
    ))
    .await?
    .json::<ChallengeInfo>()
    .await
}

pub async fn get_user(user_id: &u32) -> reqwest::Result<UserInfo> {
    let text = reqwest::get(format!("https://dreamhack.io/users/{}", user_id))
        .await?
        .text()
        .await?;

    let document = Html::parse_document(&text);

    let extract_text = |selector: &Selector| -> String {
        document
            .select(selector)
            .next()
            .map(|el| el.text().collect::<String>())
            .unwrap_or_default()
            .trim()
            .replace('`', "'")
    };

    let nickname = extract_text(&NICKNAME_SEL);
    let introduction = extract_text(&INTRO_SEL);

    let profile_image = document
        .select(&IMG_SEL)
        .next()
        .and_then(|el| el.value().attr("src"))
        .unwrap_or("https://static.dreamhack.io/main/v2/img/amo.1a05d65.png")
        .trim()
        .replace('`', "'");

    Ok(UserInfo {
        nickname,
        introduction,
        profile_image,
    })
}
