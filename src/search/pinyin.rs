use pinyin::ToPinyin;

/// 将字符串转换为拼音，非中文字符保留原样
/// 例如: "Chrome浏览器" -> "Chrome liu lan qi"
pub fn to_pinyin(text: &str) -> String {
    let mut result = String::with_capacity(text.len() * 2);
    for ch in text.chars() {
        if let Some(py) = ch.to_pinyin() {
            if !result.is_empty() && !result.ends_with(' ') {
                result.push(' ');
            }
            result.push_str(py.plain());
        } else {
            result.push(ch);
        }
    }
    result
}

/// 获取字符串的首字母拼音
/// 例如: "Chrome浏览器" -> "Chrome llq"
pub fn to_pinyin_initials(text: &str) -> String {
    let mut result = String::with_capacity(text.len());
    for ch in text.chars() {
        if let Some(py) = ch.to_pinyin() {
            if let Some(first) = py.plain().chars().next() {
                result.push(first);
            }
        } else {
            result.push(ch.to_lowercase().next().unwrap_or(ch));
        }
    }
    result
}

/// 检查字符串是否包含中文字符
#[allow(dead_code)]
pub fn contains_chinese(text: &str) -> bool {
    text.chars().any(|ch| ch.to_pinyin().is_some())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_to_pinyin() {
        let result = to_pinyin("浏览器");
        assert!(result.contains("liu"));
        assert!(result.contains("lan"));
        assert!(result.contains("qi"));
    }

    #[test]
    fn test_to_pinyin_initials() {
        let result = to_pinyin_initials("浏览器");
        assert_eq!(result, "llq");
    }

    #[test]
    fn test_mixed_text() {
        let result = to_pinyin("Chrome浏览器");
        assert!(result.contains("Chrome"));
        assert!(result.contains("liu"));
    }

    #[test]
    fn test_contains_chinese() {
        assert!(contains_chinese("浏览器"));
        assert!(!contains_chinese("Chrome"));
        assert!(contains_chinese("Chrome浏览器"));
    }
}
