use http::Request;
use tauri::UriSchemeResponder;

pub fn handle_request(request: Request<Vec<u8>>, responder: UriSchemeResponder) {
    if request.method() == http::Method::OPTIONS {
        responder.respond(
            http::Response::builder()
                .status(http::StatusCode::NO_CONTENT)
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, OPTIONS")
                .header("Access-Control-Allow-Headers", "*")
                .header("Access-Control-Max-Age", "86400")
                .body(Vec::<u8>::new())
                .unwrap(),
        );
        return;
    }
    let path_part = request.uri().path();
    let path = percent_encoding::percent_decode_str(path_part.trim_start_matches('/'))
        .decode_utf8_lossy()
        .to_string();
    eprintln!("[rs-asset] uri={} path={}", request.uri(), path);
    match std::fs::read(&path) {
        Ok(data) => {
            let mime = mime_guess::from_path(&path).first_or_octet_stream();
            responder.respond(
                http::Response::builder()
                    .header("Access-Control-Allow-Origin", "*")
                    .header("Access-Control-Allow-Methods", "GET, OPTIONS")
                    .header("Access-Control-Allow-Headers", "*")
                    .header(http::header::CONTENT_TYPE, mime.essence_str())
                    .body(data)
                    .unwrap(),
            );
        }
        Err(e) => {
            eprintln!("[rs-asset] read error: {}", e);
            responder.respond(
                http::Response::builder()
                    .status(http::StatusCode::NOT_FOUND)
                    .header("Access-Control-Allow-Origin", "*")
                    .header(http::header::CONTENT_TYPE, "text/plain")
                    .body(format!("path={} err={}", path, e).into_bytes())
                    .unwrap(),
            );
        }
    }
}
