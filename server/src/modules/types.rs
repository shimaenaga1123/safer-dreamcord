use actix_web::{http::StatusCode, *};
use serde::{Deserialize, Serialize};
use serde_json::json;
use tracing::error;

#[derive(Debug)]
pub struct AppError(anyhow::Error);
impl std::fmt::Display for AppError {
    fn fmt(&self, _f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        error!("{}", self.0);
        Ok(())
    }
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        HttpResponse::InternalServerError().json(json!({
            "error": self.0.to_string()
        }))
    }

    fn status_code(&self) -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError(err)
    }
}

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
