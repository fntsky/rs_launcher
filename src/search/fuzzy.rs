use crate::search::pinyin::{to_pinyin, to_pinyin_initials};

/// 计算模糊匹配分数
///
/// 算法：
/// - 精确匹配: 1.0
/// - 前缀匹配: 0.85
/// - 包含匹配: 0.6
/// - 子序列匹配: 根据连续性和位置计算分数
/// - 拼音匹配: 对中文应用同样的匹配逻辑
/// - 拼音首字母匹配: 0.5
/// - 不匹配: 0.0
pub fn fuzzy_match(query: &str, target: &str) -> f64 {
    if query.is_empty() || target.is_empty() {
        return 0.0;
    }

    let query_lower = query.to_lowercase();
    let target_lower = target.to_lowercase();

    // 精确匹配
    if query_lower == target_lower {
        return 1.0;
    }

    // 前缀匹配
    if target_lower.starts_with(&query_lower) {
        return 0.85 + (query.len() as f64 / target.len() as f64) * 0.15;
    }

    // 包含匹配
    if target_lower.contains(&query_lower) {
        return 0.6 + (query.len() as f64 / target.len() as f64) * 0.25;
    }

    // 子序列匹配（字符跳跃匹配）
    let subsequence_score = subsequence_match(&query_lower, &target_lower);
    if subsequence_score > 0.0 {
        return subsequence_score;
    }

    // 拼音匹配（针对中文）
    let pinyin_target = to_pinyin(&target_lower);
    let pinyin_initials_target = to_pinyin_initials(&target_lower);

    // 拼音全拼匹配
    if pinyin_target.contains(&query_lower) {
        return 0.55 + (query.len() as f64 / pinyin_target.len() as f64) * 0.2;
    }

    // 拼音首字母匹配
    if pinyin_initials_target.starts_with(&query_lower) {
        return 0.5 + (query.len() as f64 / pinyin_initials_target.len() as f64) * 0.2;
    }

    // 拼音子序列匹配
    let pinyin_subsequence = subsequence_match(&query_lower, &pinyin_target);
    if pinyin_subsequence > 0.0 {
        return pinyin_subsequence * 0.8;
    }

    0.0
}

/// 子序列匹配算法
/// 检查 query 的每个字符是否按顺序出现在 target 中
fn subsequence_match(query: &str, target: &str) -> f64 {
    let query_chars: Vec<char> = query.chars().collect();
    let target_chars: Vec<char> = target.chars().collect();

    if query_chars.is_empty() || target_chars.is_empty() {
        return 0.0;
    }

    let mut match_positions = Vec::new();
    let mut target_idx = 0;

    for &q_char in &query_chars {
        let mut found = false;
        while target_idx < target_chars.len() {
            if target_chars[target_idx] == q_char {
                match_positions.push(target_idx);
                target_idx += 1;
                found = true;
                break;
            }
            target_idx += 1;
        }
        if !found {
            return 0.0;
        }
    }

    // 计算匹配质量
    let coverage = match_positions.len() as f64 / target_chars.len() as f64;
    let continuity = calculate_continuity(&match_positions);
    let position_score = 1.0 - (match_positions[0] as f64 / target_chars.len() as f64) * 0.3;

    (0.3 + coverage * 0.3 + continuity * 0.3 + position_score * 0.1).min(0.55)
}

/// 计算匹配的连续性
fn calculate_continuity(positions: &[usize]) -> f64 {
    if positions.len() < 2 {
        return 0.0;
    }

    let mut consecutive_count = 0;
    for i in 1..positions.len() {
        if positions[i] == positions[i - 1] + 1 {
            consecutive_count += 1;
        }
    }

    consecutive_count as f64 / (positions.len() - 1) as f64
}

/// 对结果列表进行模糊排序
#[allow(dead_code)]
pub fn fuzzy_sort<T, F>(items: Vec<T>, query: &str, scorer: F) -> Vec<(T, f64)>
where
    F: Fn(&T, &str) -> f64,
{
    let mut scored: Vec<(T, f64)> = items
        .into_iter()
        .map(|item| {
            let score = scorer(&item, query);
            (item, score)
        })
        .filter(|(_, score)| *score > 0.0)
        .collect();

    scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    scored
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_exact_match() {
        assert_eq!(fuzzy_match("chrome", "Chrome"), 1.0);
    }

    #[test]
    fn test_prefix_match() {
        let score = fuzzy_match("chr", "Chrome");
        assert!(score >= 0.85);
        assert!(score < 1.0);
    }

    #[test]
    fn test_contains_match() {
        let score = fuzzy_match("rome", "Chrome");
        assert!(score >= 0.6);
        assert!(score < 0.85);
    }

    #[test]
    fn test_subsequence_match() {
        let score = fuzzy_match("ch", "Chrome");
        assert!(score > 0.0);
        // "ch" 是 "Chrome" 的前缀，所以分数应该 >= 0.85
        assert!(score >= 0.85);
    }

    #[test]
    fn test_no_match() {
        assert_eq!(fuzzy_match("xyz", "Chrome"), 0.0);
    }

    #[test]
    fn test_pinyin_full_match() {
        // 搜索 "liulan" 应该匹配 "浏览器"
        let score = fuzzy_match("liulan", "浏览器");
        assert!(score > 0.0, "拼音全拼匹配应该能匹配到中文");
    }

    #[test]
    fn test_pinyin_initials_match() {
        // 搜索 "llq" 应该匹配 "浏览器"
        let score = fuzzy_match("llq", "浏览器");
        assert!(score > 0.0, "拼音首字母匹配应该能匹配到中文");
    }

    #[test]
    fn test_chinese_query() {
        // 搜索 "浏览" 应该匹配 "浏览器"
        let score = fuzzy_match("浏览", "浏览器");
        assert!(score > 0.0, "中文搜索应该能匹配");
    }
}
