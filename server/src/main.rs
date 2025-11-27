use actix_cors::Cors;
use actix_web::{http::header, middleware::Logger, *};
mod modules;
use crate::modules::{dmessage::build_solved_message, types::RequestType};
use dotenv::dotenv;
use once_cell::sync::Lazy;

static URL: Lazy<String> = Lazy::new(|| {
    dotenv().ok();
    std::env::var("DISCORD_WEBHOOK_URL").expect("DISCORD_WEBHOOK_URL must be set")
});

#[post("/")]
async fn default(body: web::Json<RequestType>) -> HttpResponse {
    let message = match build_solved_message(&body.challengeId, &body.solver, &body.test).await {
        Ok(json_message) => match serde_json::to_string(&json_message) {
            Ok(json_string) => json_string,
            Err(error) => {
                eprintln!("Failed to serialize JSON message: {}", error);
                return HttpResponse::InternalServerError().body(error.to_string());
            }
        },
        Err(error) => {
            eprintln!("Failed to build solved message: {}", error);
            return HttpResponse::InternalServerError().body(error.to_string());
        }
    };
    match reqwest::Client::new()
        .post(URL.to_owned())
        .header("Content-Type", "application/json")
        .body(message)
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                HttpResponse::Ok().finish()
            } else {
                HttpResponse::BadGateway().body(response.status().to_string())
            }
        }
        Err(error) => {
            eprintln!("Failed to send request: {}", error);
            HttpResponse::InternalServerError().body(error.to_string())
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    HttpServer::new(|| {
        let cors = Cors::default()
            .allow_any_origin()
            .allowed_methods(vec!["POST"])
            .allowed_header(header::CONTENT_TYPE)
            .max_age(86400);
        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .service(default)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
