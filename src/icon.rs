use std::path::Path;
use std::ffi::OsStr;
use std::os::windows::ffi::OsStrExt;

/// Extract icon from an executable file and save as PNG to temp directory.
/// Returns the path to the saved PNG file, or empty string on failure.
pub fn extract_icon_to_png(exe_path: &str) -> String {
    if exe_path.is_empty() || !exe_path.to_lowercase().ends_with(".exe") {
        return String::new();
    }

    if !Path::new(exe_path).exists() {
        return String::new();
    }

    unsafe {
        // Initialize COM
        let hr = windows_sys::Win32::System::Com::CoInitializeEx(
            std::ptr::null(),
            windows_sys::Win32::System::Com::COINIT_APARTMENTTHREADED as u32,
        );

        let result = extract_icon_to_png_inner(exe_path);

        if hr == 0 {
            windows_sys::Win32::System::Com::CoUninitialize();
        }

        result
    }
}

unsafe fn extract_icon_to_png_inner(exe_path: &str) -> String {
    use windows_sys::Win32::UI::Shell::ExtractIconW;
    use windows_sys::Win32::UI::WindowsAndMessaging::{DestroyIcon, GetIconInfo, ICONINFO};
    use windows_sys::Win32::Graphics::Gdi::{GetDIBits, SelectObject, DeleteObject, DeleteDC, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, GetObjectW, BITMAP};
    use windows_sys::Win32::Foundation::HWND;

    let wide_path: Vec<u16> = OsStr::new(exe_path)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    // Extract icon (index 0 = first icon)
    let hicon = ExtractIconW(
        HWND::default(),
        wide_path.as_ptr(),
        0,
    );

    if hicon.is_null() || hicon as isize <= 1 {
        // -1 means no icons, 0 means invalid
        return String::new();
    }

    // Get icon info
    let mut icon_info: ICONINFO = std::mem::zeroed();
    if GetIconInfo(hicon, &mut icon_info) == 0 {
        DestroyIcon(hicon);
        return String::new();
    }

    // We'll use the color bitmap (hbmColor)
    let hbm_color = icon_info.hbmColor;
    let hbm_mask = icon_info.hbmMask;

    if hbm_color.is_null() {
        // Try to use mask if no color bitmap
        if !hbm_mask.is_null() {
            DeleteObject(hbm_mask as _);
        }
        DestroyIcon(hicon);
        return String::new();
    }

    // Get bitmap dimensions
    let mut bm: BITMAP = std::mem::zeroed();
    let bm_size = GetObjectW(
        hbm_color as _,
        std::mem::size_of::<BITMAP>() as i32,
        &mut bm as *mut _ as *mut _,
    );

    if bm_size == 0 {
        DeleteObject(hbm_color as _);
        if !hbm_mask.is_null() {
            DeleteObject(hbm_mask as _);
        }
        DestroyIcon(hicon);
        return String::new();
    }

    let width = bm.bmWidth;
    let height = bm.bmHeight;

    // Create DC and get bits
    let hdc = windows_sys::Win32::Graphics::Gdi::CreateCompatibleDC(std::ptr::null_mut());
    if hdc.is_null() {
        DeleteObject(hbm_color as _);
        if !hbm_mask.is_null() {
            DeleteObject(hbm_mask as _);
        }
        DestroyIcon(hicon);
        return String::new();
    }

    let old_bmp = SelectObject(hdc, hbm_color as _);

    // Prepare BITMAPINFO for GetDIBits
    let mut bmi: BITMAPINFO = std::mem::zeroed();
    bmi.bmiHeader.biSize = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
    bmi.bmiHeader.biWidth = width;
    bmi.bmiHeader.biHeight = -height; // top-down
    bmi.bmiHeader.biPlanes = 1;
    bmi.bmiHeader.biBitCount = 32; // BGRA
    bmi.bmiHeader.biCompression = BI_RGB;

    let row_size = (width * 4) as usize;
    let buf_size = row_size * height as usize;
    let mut pixels: Vec<u8> = vec![0u8; buf_size];

    let result = GetDIBits(
        hdc,
        hbm_color,
        0,
        height as u32,
        pixels.as_mut_ptr() as *mut _,
        &mut bmi,
        DIB_RGB_COLORS,
    );

    // Restore and cleanup GDI objects
    SelectObject(hdc, old_bmp);
    DeleteDC(hdc);
    DeleteObject(hbm_color as _);
    if !hbm_mask.is_null() {
        DeleteObject(hbm_mask as _);
    }
    DestroyIcon(hicon);

    if result == 0 {
        return String::new();
    }

    // Convert BGRA to RGBA for PNG (straight alpha, no premultiplication)
    for chunk in pixels.chunks_exact_mut(4) {
        // BGRA -> RGBA: swap B and R channels
        chunk.swap(0, 2);
    }

    // Encode as PNG and return base64 data URL
    encode_png_to_base64(&pixels, width as u32, height as u32)
}

fn encode_png_to_base64(pixels: &[u8], width: u32, height: u32) -> String {
    let mut png_buf = Vec::new();
    {
        let mut encoder = png::Encoder::new(std::io::Cursor::new(&mut png_buf), width, height);
        encoder.set_color(png::ColorType::Rgba);
        encoder.set_depth(png::BitDepth::Eight);
        let mut writer = match encoder.write_header() {
            Ok(w) => w,
            Err(_) => return String::new(),
        };
        if writer.write_image_data(pixels).is_err() {
            return String::new();
        }
    }

    format!("data:image/png;base64,{}", base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &png_buf))
}
