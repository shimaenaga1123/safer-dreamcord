use actix_web::*;
use tracing::Span;
use tracing_actix_web::RootSpanBuilder;

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
