use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct ChallengeInfo {
    pub difficulty: u8,
    pub cnt_solvers: u32,
    pub hitcount: u32,
    pub title: String,
    pub tags: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct UserInfo {
    pub nickname: String,
    pub introduction: String,
    pub profile_image: String,
}

#[derive(Serialize, Deserialize)]
pub struct Image {
    pub url: String,
}

#[derive(Serialize, Deserialize)]
pub struct Embed {
    pub title: String,
    pub description: String,
    pub color: u32,
    pub url: String,
    pub timestamp: String,
    pub thumbnail: Image,
}

#[derive(Serialize, Deserialize)]
pub struct SolvedMessage {
    pub content: String,
    pub embeds: Vec<Embed>,
}

#[derive(Serialize, Deserialize)]
pub struct RequestType {
    pub challenge_id: u32,
    pub solver: u32,
    pub test: bool,
}
