use actix_cors::Cors;
use actix_web::{http::header, *};
use tracing::{error, info, Level, Span};
use tracing_actix_web::{RootSpanBuilder, TracingLogger};
use tracing_subscriber::FmtSubscriber;

mod modules;
use crate::modules::{dmessage::build_solved_message, types::RequestType};
use dotenv::dotenv;
use once_cell::sync::Lazy;

static URL: Lazy<String> = Lazy::new(|| {
    dotenv().ok();
    std::env::var("DISCORD_WEBHOOK_URL").expect("DISCORD_WEBHOOK_URL must be set")
});

pub struct CustomRootSpanBuilder;

impl RootSpanBuilder for CustomRootSpanBuilder {
    fn on_request_start(request: &dev::ServiceRequest) -> Span {
        let peer_ip = request
            .connection_info()
            .peer_addr()
            .unwrap_or("unknown")
            .to_string();

        let real_ip = request
            .headers()
            .get("CF-Connecting-IP")
            .or_else(|| request.headers().get("X-Forwarded-For"))
            .and_then(|v| v.to_str().ok())
            .map(|s| s.split(',').next().unwrap_or(s).trim().to_string())
            .unwrap_or(peer_ip);

        tracing::info_span!(
            "request",
            method = %request.method(),
            path = %request.path(),
            ip = %real_ip,
        )
    }

    fn on_request_end<B: actix_web::body::MessageBody>(
        span: Span,
        outcome: &Result<dev::ServiceResponse<B>, actix_web::Error>,
    ) {
        match outcome {
            Ok(response) => match response.status().as_u16() {
                200 => tracing::info!("completed"),
                _ => tracing::warn!("completed with status {}", response.status()),
            },
            Err(error) => {
                tracing::error!(error = %error, "failed");
            }
        }
    }
}

#[post("/")]
async fn default(body: web::Json<RequestType>) -> HttpResponse {
    info!(
        challengeId = %body.challengeId,
        solver = %body.solver,
        test = %body.test,
        "received request"
    );

    let message = match build_solved_message(&body.challengeId, &body.solver, &body.test).await {
        Ok(json_message) => match serde_json::to_string(&json_message) {
            Ok(json_string) => json_string,
            Err(err) => {
                error!(error = %err, "failed to serialize JSON message");
                return HttpResponse::InternalServerError().body(err.to_string());
            }
        },
        Err(err) => {
            error!(
                error = %err,
                challengeId = %body.challengeId,
                "failed to build solved message"
            );
            return HttpResponse::InternalServerError().body(err.to_string());
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
                info!("webhook sent successfully");
                HttpResponse::Ok().finish()
            } else {
                error!(status = %response.status(), "webhook returned error");
                HttpResponse::BadGateway().body(response.status().to_string())
            }
        }
        Err(err) => {
            error!(error = %err, "failed to send webhook");
            HttpResponse::InternalServerError().body(err.to_string())
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    FmtSubscriber::builder()
        .pretty()
        .with_file(false)
        .with_line_number(false)
        .with_max_level(Level::INFO)
        .with_target(false)
        .init();

    HttpServer::new(|| {
        let cors = Cors::default()
            .allow_any_origin()
            .allowed_methods(vec!["POST"])
            .allowed_header(header::CONTENT_TYPE)
            .max_age(86400);
        App::new()
            .wrap(cors)
            .wrap(TracingLogger::<CustomRootSpanBuilder>::new())
            .service(default)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
