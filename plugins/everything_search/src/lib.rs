use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::os::windows::ffi::OsStrExt;
use std::sync::Mutex;
use std::collections::HashMap;
use once_cell::sync::Lazy;

pub struct EverythingPlugin;

static ICON_CACHE: Lazy<Mutex<HashMap<String, String>>> = Lazy::new(|| Mutex::new(HashMap::new()));

fn extract_file_icon(path: &str) -> String {
    use windows_sys::Win32::UI::Shell::{SHGetFileInfoW, SHGFI_ICON, SHGFI_SMALLICON, SHFILEINFOW};
    use windows_sys::Win32::UI::WindowsAndMessaging::{DestroyIcon, GetIconInfo};
    use windows_sys::Win32::Graphics::Gdi::{GetObjectW, BITMAP};

    // Extract extension for cache key
    let cache_key = std::path::Path::new(path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("_folder_")
        .to_lowercase();
    // Check cache first
    if let Ok(cache) = ICON_CACHE.lock() {
        if let Some(cached) = cache.get(&cache_key) {
            return cached.clone();
        }
    }

    let wide_path: Vec<u16> = std::ffi::OsStr::new(path)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    let mut shfi: SHFILEINFOW = unsafe { std::mem::zeroed() };

    let ret = unsafe {
        SHGetFileInfoW(
            wide_path.as_ptr(),
            0,
            &mut shfi as *mut _ as *mut _,
            std::mem::size_of::<SHFILEINFOW>() as u32,
            SHGFI_ICON | SHGFI_SMALLICON,
        )
    };

    if ret == 0 || shfi.hIcon == std::ptr::null_mut() {
        return String::new();
    }

    // Get actual icon bitmap size
    let mut icon_info = unsafe { std::mem::zeroed() };
    let mut width = 16;
    let mut height = 16;
    if unsafe { GetIconInfo(shfi.hIcon, &mut icon_info) } != 0 {
        let mut bmp: BITMAP = unsafe { std::mem::zeroed() };
        unsafe { GetObjectW(icon_info.hbmColor, std::mem::size_of::<BITMAP>() as i32, &mut bmp as *mut _ as *mut _); }
        width = bmp.bmWidth;
        height = bmp.bmHeight;
        unsafe {
            windows_sys::Win32::Graphics::Gdi::DeleteObject(icon_info.hbmColor);
            windows_sys::Win32::Graphics::Gdi::DeleteObject(icon_info.hbmMask);
        }
    }

    let result = icon_to_png(shfi.hIcon, width, height);
    unsafe { DestroyIcon(shfi.hIcon); }

    // Store in cache by extension
    if let Ok(mut cache) = ICON_CACHE.lock() {
        cache.insert(cache_key, result.clone());
    }

    result
}

fn icon_to_png(hicon: *mut core::ffi::c_void, width: i32, height: i32) -> String {
    use windows_sys::Win32::Graphics::Gdi::{
        CreateCompatibleDC, DeleteDC, DeleteObject, GetDIBits, SelectObject,
        GetObjectW, BITMAP, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS,
    };
    use windows_sys::Win32::UI::WindowsAndMessaging::{GetIconInfo, ICONINFO};

    let mut icon_info: ICONINFO = unsafe { std::mem::zeroed() };
    if unsafe { GetIconInfo(hicon, &mut icon_info) } == 0 {
        eprintln!("[ICON] GetIconInfo failed");
        return String::new();
    }

    if icon_info.hbmColor == std::ptr::null_mut() {
        eprintln!("[ICON] hbmColor is null");
        unsafe { DeleteObject(icon_info.hbmMask); }
        return String::new();
    }

    // Get actual bitmap dimensions
    let mut bmp: BITMAP = unsafe { std::mem::zeroed() };
    let bmp_size = unsafe { GetObjectW(icon_info.hbmColor, std::mem::size_of::<BITMAP>() as i32, &mut bmp as *mut _ as *mut _) };
    eprintln!("[ICON] GetObjectW returned {}, bitmap: {}x{}x{}", bmp_size, bmp.bmWidth, bmp.bmHeight, bmp.bmBitsPixel);

    let dc = unsafe { CreateCompatibleDC(std::ptr::null_mut()) };
    if dc == std::ptr::null_mut() {
        eprintln!("[ICON] CreateCompatibleDC failed");
        unsafe { DeleteObject(icon_info.hbmColor); DeleteObject(icon_info.hbmMask); }
        return String::new();
    }

    // Select the color bitmap into the DC
    let old_bitmap = unsafe { SelectObject(dc, icon_info.hbmColor) };
    if old_bitmap == std::ptr::null_mut() {
        eprintln!("[ICON] SelectObject failed");
        unsafe { DeleteDC(dc); DeleteObject(icon_info.hbmColor); DeleteObject(icon_info.hbmMask); }
        return String::new();
    }

    // Setup BITMAPINFOHEADER for GetDIBits
    let mut bmi_data: [u8; 64] = [0u8; 64];
    let bmi = bmi_data.as_mut_ptr() as *mut BITMAPINFOHEADER;
    unsafe {
        (*bmi).biSize = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
        (*bmi).biWidth = width;
        (*bmi).biHeight = -height; // top-down
        (*bmi).biPlanes = 1;
        (*bmi).biBitCount = 32;
        (*bmi).biCompression = BI_RGB;
    }

    let mut pixels: Vec<u8> = vec![0u8; (width * height * 4) as usize];
    let scan_lines = unsafe {
        GetDIBits(
            dc,
            icon_info.hbmColor,
            0,
            height as u32,
            pixels.as_mut_ptr() as *mut _,
            bmi as *mut _,
            DIB_RGB_COLORS,
        )
    };

    eprintln!("[ICON] GetDIBits returned {} scan lines", scan_lines);

    // Cleanup
    unsafe {
        SelectObject(dc, old_bitmap);
        DeleteDC(dc);
        DeleteObject(icon_info.hbmColor);
        DeleteObject(icon_info.hbmMask);
    }

    if scan_lines == 0 {
        eprintln!("[ICON] GetDIBits returned 0 scan lines");
        return String::new();
    }

    // BGRA -> RGBA
    for chunk in pixels.chunks_exact_mut(4) {
        let b = chunk[0];
        let r = chunk[2];
        chunk[0] = r;
        chunk[2] = b;
    }

    // Encode as PNG using `image` crate
    let img = image::RgbaImage::from_raw(width as u32, height as u32, pixels);
    let Some(img) = img else {
        eprintln!("[ICON] RgbaImage::from_raw failed");
        return String::new();
    };

    let mut png_buf = Vec::new();
    if img.write_to(&mut std::io::Cursor::new(&mut png_buf), image::ImageFormat::Png).is_err() {
        eprintln!("[ICON] PNG encode failed");
        return String::new();
    }

    format!("data:image/png;base64,{}", base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &png_buf))
}

fn encode_rgba_as_png(rgba: &[u8], width: u32, height: u32) -> String {
    // Use a minimal PNG encoder: we'll just encode raw RGBA as PNG
    // For 16x16 icons, the data is small enough that no compression is fine
    let mut png_data = Vec::new();

    // PNG signature
    png_data.extend_from_slice(&[137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk
    let ihdr_data = {
        let mut d = Vec::new();
        d.extend_from_slice(&width.to_be_bytes());
        d.extend_from_slice(&height.to_be_bytes());
        d.push(8); // bit depth
        d.push(6); // color type: RGBA
        d.push(0); // compression
        d.push(0); // filter
        d.push(0); // interlace
        d
    };
    write_png_chunk(&mut png_data, b"IHDR", &ihdr_data);

    // IDAT chunk - raw image data with filter byte 0 per row
    let mut raw_data = Vec::with_capacity((width as usize * 4 + 1) * height as usize);
    for row in 0..height as usize {
        raw_data.push(0); // filter: None
        let start = row * width as usize * 4;
        let end = start + width as usize * 4;
        raw_data.extend_from_slice(&rgba[start..end]);
    }

    // Compress with deflate (store mode for simplicity)
    let mut deflate_data = Vec::new();
    deflate_data.push(0x78); // CMF: deflate, window 7
    deflate_data.push(0x01); // FLG: no dict, level 0
    deflate_data.extend_from_slice(&raw_data);
    let adler = adler32(&raw_data);
    deflate_data.extend_from_slice(&adler.to_be_bytes());

    write_png_chunk(&mut png_data, b"IDAT", &deflate_data);

    // IEND chunk
    write_png_chunk(&mut png_data, b"IEND", &[]);

    format!("data:image/png;base64,{}", base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &png_data))
}

fn write_png_chunk(out: &mut Vec<u8>, chunk_type: &[u8; 4], data: &[u8]) {
    out.extend_from_slice(&(data.len() as u32).to_be_bytes());
    out.extend_from_slice(chunk_type);
    out.extend_from_slice(data);
    let mut crc_data = Vec::with_capacity(4 + data.len());
    crc_data.extend_from_slice(chunk_type);
    crc_data.extend_from_slice(data);
    let crc = crc32(&crc_data);
    out.extend_from_slice(&crc.to_be_bytes());
}

fn crc32(data: &[u8]) -> u32 {
    let mut table = [0u32; 256];
    for i in 0..256 {
        let mut c = i as u32;
        for _ in 0..8 {
            c = if c & 1 != 0 { 0xEDB88320 ^ (c >> 1) } else { c >> 1 };
        }
        table[i] = c;
    }
    let mut crc = 0xFFFFFFFFu32;
    for &b in data {
        crc = table[((crc ^ b as u32) & 0xFF) as usize] ^ (crc >> 8);
    }
    crc ^ 0xFFFFFFFF
}

fn adler32(data: &[u8]) -> u32 {
    let mut a: u32 = 1;
    let mut b: u32 = 0;
    for &byte in data {
        a = (a + byte as u32) % 65521;
        b = (b + a) % 65521;
    }
    (b << 16) | a
}

fn search_everything(query: &str) -> String {
    if query.is_empty() {
        return r#"{"results":[],"error":null}"#.to_string();
    }

    use everything_ipc::wm::{EverythingClient, RequestFlags, Sort};
    use std::time::Instant;

    let everything = match EverythingClient::new() {
        Ok(e) => e,
        Err(_) => return r#"{"results":[],"error":"Everything 服务未运行，请先启动 Everything"}"#.to_string(),
    };

    let start = Instant::now();

    let list = everything
        .query_wait(query)
        .request_flags(RequestFlags::FileName | RequestFlags::Path | RequestFlags::Size)
        .sort(Sort::NameAscending)
        .max_results(100)
        .call();

    match list {
        Err(e) => {
            let msg = format!("搜索失败: {}", e);
            return format!(r#"{{"results":[],"error":"{}"}}"#, msg.replace('"', "\\\""));
        }
        Ok(list) => {
            let mut results = Vec::new();

            for item in list.iter() {
                let filename = item.get_string(RequestFlags::FileName).unwrap_or_default();
                let path = item.get_string(RequestFlags::Path).unwrap_or_default();
                let full_path = if path.is_empty() {
                    filename.clone()
                } else {
                    format!("{}\\{}", path, filename)
                };

                let size_val = item.get_size(RequestFlags::Size).unwrap_or(0);

                // Determine folder via filesystem metadata (more reliable than Everything's attributes)
                let is_folder = std::fs::metadata(&full_path)
                    .map(|m| m.is_dir())
                    .unwrap_or(false);

                let icon = extract_file_icon(&full_path);

                let size_str = if is_folder {
                    String::new()
                } else {
                    format_size(size_val)
                };

                results.push(serde_json::json!({
                    "title": filename,
                    "subtitle": full_path,
                    "is_folder": is_folder,
                    "size": size_str,
                    "icon": icon,
                }));
            }

            let elapsed = start.elapsed();
            eprintln!("[EVERYTHING] 查询 \"{}\" 找到 {} 个结果 ({}ms)", query, results.len(), elapsed.as_millis());

            serde_json::json!({
                "results": results,
                "error": null,
            })
            .to_string()
        }
    }
}

fn read_image_as_data_url(path: &str) -> String {
    use std::io::Read;

    let path_obj = std::path::Path::new(path);
    if !path_obj.exists() {
        return r#"{"url":null,"error":"file not found"}"#.to_string();
    }

    let metadata = match std::fs::metadata(path_obj) {
        Ok(m) => m,
        Err(e) => return format!(r#"{{"url":null,"error":"{}"}}"#, e.to_string()),
    };

    // 20MB limit for image preview
    if metadata.len() > 20 * 1024 * 1024 {
        return r#"{"url":null,"error":"file too large for image preview (>20MB)"}"#.to_string();
    }

    let mut file = match std::fs::File::open(path_obj) {
        Ok(f) => f,
        Err(e) => return format!(r#"{{"url":null,"error":"{}"}}"#, e.to_string()),
    };

    let mut buf = Vec::new();
    if let Err(e) = file.read_to_end(&mut buf) {
        return format!(r#"{{"url":null,"error":"{}"}}"#, e.to_string());
    }

    // Determine MIME type from extension
    let mime = match path_obj.extension().and_then(|e| e.to_str()).map(|e| e.to_lowercase()).as_deref() {
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("gif") => "image/gif",
        Some("bmp") => "image/bmp",
        Some("webp") => "image/webp",
        Some("svg") => "image/svg+xml",
        Some("ico") => "image/x-icon",
        Some("tiff") | Some("tif") => "image/tiff",
        _ => "image/png",
    };

    let b64 = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &buf);

    serde_json::json!({
        "url": format!("data:{};base64,{}", mime, b64),
        "error": null,
    }).to_string()
}

fn read_pptx_content(path: &str) -> String {
    use std::io::Read;

    let path_obj = std::path::Path::new(path);
    if !path_obj.exists() {
        return r#"{"slide_count":0,"title":null,"slides":[],"error":"file not found"}"#.to_string();
    }

    let ext = path_obj.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    if ext == "ppt" {
        return r#"{"slide_count":0,"title":null,"slides":[],"error":"旧版 .ppt 二进制格式不支持预览，请直接打开"}"#.to_string();
    }

    let metadata = match std::fs::metadata(path_obj) {
        Ok(m) => m,
        Err(e) => return format!(r#"{{"slide_count":0,"title":null,"slides":[],"error":"{}"}}"#, e.to_string()),
    };

    // 20MB hard limit for unzipping PPTX
    if metadata.len() > 20 * 1024 * 1024 {
        return r#"{"slide_count":0,"title":null,"slides":[],"error":"文件过大 (>20MB)，暂不支持预览"}"#.to_string();
    }

    let file = match std::fs::File::open(path_obj) {
        Ok(f) => f,
        Err(e) => return format!(r#"{{"url":null,"slide_count":0,"title":null,"slides":[],"error":"{}"}}"#, e.to_string()),
    };

    let mut archive = match zip::ZipArchive::new(file) {
        Ok(a) => a,
        Err(e) => return format!(r#"{{"url":null,"slide_count":0,"title":null,"slides":[],"error":"打开 pptx 失败: {}"}}"#, e.to_string()),
    };

    // Try to extract presentation title from core.xml
    let mut title: Option<String> = None;
    if let Ok(mut core) = archive.by_name("docProps/core.xml") {
        let mut s = String::new();
        if core.read_to_string(&mut s).is_ok() {
            // Look for <dc:title>...</dc:title>
            if let Some(start) = s.find("<dc:title>") {
                let after = start + "<dc:title>".len();
                if let Some(end) = s[after..].find("</dc:title>") {
                    title = Some(unescape_xml(&s[after..after + end]));
                }
            }
        }
    }

    // Collect slide file names sorted by slide number
    let mut slide_files: Vec<(u32, String)> = Vec::new();
    for i in 0..archive.len() {
        if let Ok(f) = archive.by_index_raw(i) {
            let name = f.name().to_string();
            if let Some(rest) = name.strip_prefix("ppt/slides/slide") {
                if let Some(stripped) = rest.strip_suffix(".xml") {
                    if let Ok(n) = stripped.parse::<u32>() {
                        slide_files.push((n, name));
                    }
                }
            }
        }
    }
    slide_files.sort_by_key(|(n, _)| *n);

    let mut slides: Vec<serde_json::Value> = Vec::new();
    for (idx, name) in &slide_files {
        let mut xml = String::new();
        if let Ok(mut f) = archive.by_name(name) {
            let _ = f.read_to_string(&mut xml);
        }
        let text = extract_text_from_slide_xml(&xml);
        slides.push(serde_json::json!({
            "index": idx,
            "text": text,
        }));
    }

    serde_json::json!({
        "slide_count": slide_files.len(),
        "title": title,
        "slides": slides,
        "error": null,
    }).to_string()
}

fn unescape_xml(s: &str) -> String {
    s.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&apos;", "'")
}

fn extract_text_from_slide_xml(xml: &str) -> String {
    // PowerPoint stores text inside <a:t>...</a:t> runs.
    // A slide typically has: <p:sp>...<p:txBody>...<a:p>...<a:r>...<a:t>TEXT</a:t>...</a:r>...</a:p>...</p:txBody>...</p:sp>
    // We extract all <a:t> contents in order, with line breaks between <a:p> paragraphs.
    let mut out = String::new();
    let bytes = xml.as_bytes();
    let mut i = 0;
    let mut in_para = false;
    let mut para_has_text = false;

    while i < bytes.len() {
        if i + 4 <= bytes.len() && &bytes[i..i + 4] == b"<a:p" {
            // opening paragraph
            if !out.is_empty() && para_has_text {
                out.push('\n');
                out.push('\n');
            }
            in_para = true;
            para_has_text = false;
            // skip to end of opening tag
            if let Some(end) = xml[i..].find('>') {
                i += end + 1;
            } else {
                break;
            }
            continue;
        }
        if i + 6 <= bytes.len() && &bytes[i..i + 6] == b"</a:p>" {
            in_para = false;
            i += 6;
            continue;
        }
        if i + 4 <= bytes.len() && &bytes[i..i + 4] == b"<a:t" {
            // find end of opening tag (could have attributes)
            if let Some(gt_rel) = xml[i..].find('>') {
                let text_start = i + gt_rel + 1;
                if let Some(close_rel) = xml[text_start..].find("</a:t>") {
                    let text_end = text_start + close_rel;
                    let raw = &xml[text_start..text_end];
                    let text = unescape_xml(raw);
                    if para_has_text && !text.is_empty() && !out.ends_with('\n') {
                        out.push('\n');
                    }
                    out.push_str(&text);
                    para_has_text = true;
                    i = text_end + "</a:t>".len();
                    continue;
                }
            }
        }
        i += 1;
        let _ = in_para; // suppress unused warning
    }
    out
}

fn read_docx_content(path: &str) -> String {
    use std::io::Read;

    let path_obj = std::path::Path::new(path);
    if !path_obj.exists() {
        return r#"{"title":null,"paragraphs":0,"error":"file not found"}"#.to_string();
    }

    let ext = path_obj.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    if ext == "doc" {
        return r#"{"title":null,"paragraphs":0,"error":"旧版 .doc 二进制格式不支持预览，请直接打开"}"#.to_string();
    }

    let file = match std::fs::File::open(path_obj) {
        Ok(f) => f,
        Err(e) => return format!(r#"{{"title":null,"paragraphs":0,"error":"{}"}}"#, e.to_string()),
    };

    let mut archive = match zip::ZipArchive::new(file) {
        Ok(a) => a,
        Err(e) => return format!(r#"{{"title":null,"paragraphs":0,"error":"打开 docx 失败: {}"}}"#, e.to_string()),
    };

    let mut title: Option<String> = None;
    if let Ok(mut core) = archive.by_name("docProps/core.xml") {
        let mut s = String::new();
        if core.read_to_string(&mut s).is_ok() {
            if let Some(start) = s.find("<dc:title>") {
                let after = start + "<dc:title>".len();
                if let Some(end) = s[after..].find("</dc:title>") {
                    title = Some(unescape_xml(&s[after..after + end]));
                }
            }
        }
    }

    let mut paragraphs = 0;
    if let Ok(mut doc) = archive.by_name("word/document.xml") {
        let mut s = String::new();
        if doc.read_to_string(&mut s).is_ok() {
            paragraphs = s.matches("</w:p>").count();
        }
    }

    serde_json::json!({
        "title": title,
        "paragraphs": paragraphs,
        "error": null,
    }).to_string()
}

fn read_xlsx_content(path: &str) -> String {
    use std::io::Read;

    let path_obj = std::path::Path::new(path);
    if !path_obj.exists() {
        return r#"{"sheets":0,"sheet_names":[],"error":"file not found"}"#.to_string();
    }

    let file = match std::fs::File::open(path_obj) {
        Ok(f) => f,
        Err(e) => return format!(r#"{{"sheets":0,"sheet_names":[],"error":"{}"}}"#, e.to_string()),
    };

    let mut archive = match zip::ZipArchive::new(file) {
        Ok(a) => a,
        Err(e) => return format!(r#"{{"sheets":0,"sheet_names":[],"error":"打开 xlsx 失败: {}"}}"#, e.to_string()),
    };

    let mut sheet_names: Vec<String> = Vec::new();
    if let Ok(mut wb) = archive.by_name("xl/workbook.xml") {
        let mut s = String::new();
        if wb.read_to_string(&mut s).is_ok() {
            let bytes = s.as_bytes();
            let mut i = 0;
            while i < bytes.len() {
                if i + 7 <= bytes.len() && &bytes[i..i + 7] == b"<sheet " {
                    if let Some(name_start_rel) = s[i..].find("name=\"") {
                        let name_start = i + name_start_rel + "name=\"".len();
                        if let Some(name_end_rel) = s[name_start..].find('\"') {
                            let name = &s[name_start..name_start + name_end_rel];
                            sheet_names.push(name.to_string());
                            i = name_start + name_end_rel;
                            continue;
                        }
                    }
                }
                i += 1;
            }
        }
    }

    serde_json::json!({
        "sheets": sheet_names.len(),
        "sheet_names": sheet_names,
        "error": null,
    }).to_string()
}

fn read_file_content(path: &str) -> String {
    use std::io::Read;

    let path_obj = std::path::Path::new(path);
    if !path_obj.exists() {
        return r#"{"content":null,"error":"file not found"}"#.to_string();
    }

    let metadata = match std::fs::metadata(path_obj) {
        Ok(m) => m,
        Err(e) => return format!(r#"{{"content":null,"error":"{}"}}"#, e.to_string()),
    };

    if metadata.len() > 100 * 1024 {
        return r#"{"content":null,"error":"file too large for preview (>100KB)"}"#.to_string();
    }

    let mut file = match std::fs::File::open(path_obj) {
        Ok(f) => f,
        Err(e) => return format!(r#"{{"content":null,"error":"{}"}}"#, e.to_string()),
    };

    let mut content = String::new();
    if let Err(e) = file.read_to_string(&mut content) {
        return format!(r#"{{"content":null,"error":"{}"}}"#, e.to_string());
    }

    serde_json::json!({
        "content": content,
        "error": null,
    }).to_string()
}

fn format_size(bytes: u64) -> String {
    if bytes >= 1073741824 {
        format!("{:.1} GB", bytes as f64 / 1073741824.0)
    } else if bytes >= 1048576 {
        format!("{:.1} MB", bytes as f64 / 1048576.0)
    } else if bytes >= 1024 {
        format!("{:.1} KB", bytes as f64 / 1024.0)
    } else {
        format!("{} B", bytes)
    }
}

// ============================================================
// C ABI Exports
// ============================================================

#[no_mangle]
pub extern "C" fn plugin_create() -> *mut EverythingPlugin {
    Box::into_raw(Box::new(EverythingPlugin))
}

#[no_mangle]
pub extern "C" fn plugin_destroy(p: *mut EverythingPlugin) {
    if !p.is_null() {
        unsafe {
            drop(Box::from_raw(p));
        }
    }
}

#[no_mangle]
pub extern "C" fn plugin_id(_p: *mut EverythingPlugin) -> *const c_char {
    b"everything_search\0".as_ptr() as *const c_char
}

#[no_mangle]
pub extern "C" fn plugin_name(_p: *mut EverythingPlugin) -> *const c_char {
    "Everything 文件搜索\0".as_ptr() as *const c_char
}

#[no_mangle]
pub extern "C" fn plugin_query(_p: *mut EverythingPlugin, q: *const c_char) -> *const c_char {
    let query = unsafe { CStr::from_ptr(q).to_str().unwrap_or("") };

    let results = if query.is_empty() {
        // Return entry point result for empty query
        r#"[{"plugin_id":"everything_search","title":"Everything 文件搜索","subtitle":"搜索文件和文件夹","relevance":0.3,"icon_path":"🔍","action":"open_renderer","template":"default"}]"#
    } else {
        let q_lower = query.to_lowercase();
        if q_lower.contains("ev") || q_lower.contains("文件") || q_lower.contains("搜索") || q_lower.contains("file") || q_lower.contains("search") {
            r#"[{"plugin_id":"everything_search","title":"Everything 文件搜索","subtitle":"搜索文件和文件夹","relevance":0.5,"icon_path":"🔍","action":"open_renderer","template":"default"}]"#
        } else {
            "[]"
        }
    };

    CString::new(results).unwrap().into_raw() as *const c_char
}

#[no_mangle]
pub extern "C" fn plugin_free_results(s: *const c_char) {
    if !s.is_null() {
        unsafe {
            let _ = CString::from_raw(s as *mut _);
        }
    }
}

#[no_mangle]
pub extern "C" fn plugin_invoke(
    _p: *mut EverythingPlugin,
    command: *const c_char,
    args: *const c_char,
) -> *const c_char {
    let cmd = unsafe { CStr::from_ptr(command).to_str().unwrap_or("") };
    let args_str = unsafe { CStr::from_ptr(args).to_str().unwrap_or("{}") };

    let result = match cmd {
        "search" => {
            let query = serde_json::from_str::<serde_json::Value>(args_str)
                .ok()
                .and_then(|v| v["query"].as_str().map(|s| s.to_string()))
                .unwrap_or_default();
            search_everything(&query)
        }
        "read_image" => {
            let path = serde_json::from_str::<serde_json::Value>(args_str)
                .ok()
                .and_then(|v| v["path"].as_str().map(|s| s.to_string()))
                .unwrap_or_default();
            read_image_as_data_url(&path)
        }
        "read_file" => {
            let path = serde_json::from_str::<serde_json::Value>(args_str)
                .ok()
                .and_then(|v| v["path"].as_str().map(|s| s.to_string()))
                .unwrap_or_default();
            read_file_content(&path)
        }
        "read_pptx" => {
            let path = serde_json::from_str::<serde_json::Value>(args_str)
                .ok()
                .and_then(|v| v["path"].as_str().map(|s| s.to_string()))
                .unwrap_or_default();
            read_pptx_content(&path)
        }
        "read_docx" => {
            let path = serde_json::from_str::<serde_json::Value>(args_str)
                .ok()
                .and_then(|v| v["path"].as_str().map(|s| s.to_string()))
                .unwrap_or_default();
            read_docx_content(&path)
        }
        "read_xlsx" => {
            let path = serde_json::from_str::<serde_json::Value>(args_str)
                .ok()
                .and_then(|v| v["path"].as_str().map(|s| s.to_string()))
                .unwrap_or_default();
            read_xlsx_content(&path)
        }
        _ => r#"{"error":"unknown command"}"#.to_string(),
    };

    CString::new(result).unwrap().into_raw() as *const c_char
}