use actix_cors::Cors;
use actix_web::{http::header, *};
use tracing::{info, Level};
use tracing_actix_web::TracingLogger;
use tracing_subscriber::FmtSubscriber;

mod modules;
use crate::modules::*;

#[post("/")]
async fn default(body: web::Json<types::RequestType>) -> Result<impl Responder, types::AppError> {
    info!(
        challenge_id = %body.challenge_id,
        solver = %body.solver,
        test = %body.test,
        "received request"
    );

    let message =
        dmessage::build_solved_message(&body.challenge_id, &body.solver, &body.test).await?;

    if body.test {
        info!("test mode: returning message without sending webhook");
        Ok(HttpResponse::Ok()
            .content_type("application/json")
            .body(message))
    } else {
        dmessage::send_message(message).await?;
        info!("webhook sent successfully");
        Ok(HttpResponse::Ok().finish())
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
            .wrap(TracingLogger::<logger::CustomRootSpanBuilder>::new())
            .service(default)
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
