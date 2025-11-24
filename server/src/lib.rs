use wasm_bindgen::prelude::*;
use worker::*;

use crate::modules::{dmessage::build_solved_message, types::RequestType};
mod modules;

#[event(fetch)]
async fn fetch(mut _req: Request, _env: Env, _ctx: Context) -> Result<Response> {
    let headers = worker::Headers::new();
    let response = if _req.method() == Method::Options {
        headers.set("Access-Control-Allow-Methods", "POST, OPTIONS")?;
        headers.set("Access-Control-Allow-Headers", "Content-Type")?;
        headers.set("Access-Control-Max-Age", "86400")?;
        Response::empty()
    } else if _req.method() != Method::Post {
        Response::error("Method Not Allowed", 405)
    } else {
        let message = {
            let body = _req.text().await?;
            let data: RequestType = serde_json::from_str(&body)?;
            let json_message =
                build_solved_message(data.challengeId, data.solver, data.test).await?;
            serde_json::to_string(&json_message)?
        };
        let mut request_init = RequestInit::new();
        request_init
            .with_method(Method::Post)
            .with_headers({
                let headers = Headers::new();
                headers.set("Content-Type", "application/json")?;
                headers
            })
            .with_body(Some(JsValue::from_str(&message)));
        let external_request = Request::new_with_init(
            &_env.secret("DISCORD_WEBHOOK_URL")?.to_string(),
            &request_init,
        )?;
        Fetch::Request(external_request).send().await
    };
    headers.set("Access-Control-Allow-Origin", "*")?;
    response.map(|res| res.with_headers(headers))
}
