use actix_cors::Cors;
use actix_web::{http::header, *};
use tracing::{error, info, Level};
use tracing_actix_web::TracingLogger;
use tracing_subscriber::FmtSubscriber;

mod modules;
use dotenv::dotenv;
use once_cell::sync::Lazy;

static URL: Lazy<String> = Lazy::new(|| {
    dotenv().ok();
    std::env::var("DISCORD_WEBHOOK_URL").expect("DISCORD_WEBHOOK_URL must be set")
});

#[post("/")]
async fn default(body: web::Json<modules::types::RequestType>) -> HttpResponse {
    info!(
        challenge_id = %body.challenge_id,
        solver = %body.solver,
        test = %body.test,
        "received request"
    );

    let message =
        match modules::dmessage::build_solved_message(&body.challenge_id, &body.solver, &body.test)
            .await
        {
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
                    challenge_id = %body.challenge_id,
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
            .wrap(TracingLogger::<modules::logger::CustomRootSpanBuilder>::new())
            .service(default)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
