use crate::modules::performance;
use crate::modules::request;
use crate::modules::types::*;
use indoc::indoc;

pub async fn build_solved_message(
    challenge_id: &String,
    solver_id: &u32,
    test: &bool,
) -> reqwest::Result<SolvedMessage> {
    let challenge_info = request::get_challenge(&challenge_id).await?;

    let rate = challenge_info.cnt_solvers as f64 / challenge_info.hitcount as f64 * 100.0;
    let level_color = match challenge_info.difficulty {
        1..=3 => 0x43B581,
        4..=6 => 0x09BAF9,
        7..=8 => 0x013CC7,
        9 => 0xFC4749,
        10 => 0xC90002,
        _ => 0xFFFFFF,
    };

    let pp = performance::calculate_pp(&challenge_info);

    let solver = request::get_user(solver_id).await?;

    Ok(SolvedMessage {
        content: "".to_string(),
        embeds: vec![Embed {
            title: format!("🎉 {} 문제 해결!", challenge_info.title),
            description: format!(
                indoc! {
                    "**해결자**
                    [`{}`](https://dreamhack.io/users/{}){}

                    **난이도**
                    LEVEL {}

                    **태그**
                    {}

                    **솔버 수**
                    {} solved / {} viewed ({}{:.2}%{})

                    **예상되는 퍼포먼스**
                    {:.2}pp
                    {}
                    "
                },
                solver.nickname,
                solver_id,
                if solver.introduction != "아직 자기소개가 없습니다." {
                    format!(" | `{}`", solver.introduction)
                } else {
                    String::new()
                },
                challenge_info.difficulty,
                challenge_info.tags.join(", "),
                challenge_info.cnt_solvers,
                challenge_info.hitcount,
                if rate < 2.0 { "**" } else { "" },
                rate,
                if rate < 2.0 { "**" } else { "" },
                pp,
                if *test {
                    "\n\n*이 메시지는 웹훅 테스트 메시지이며, 실제로 풀이된 것이 아닙니다.*"
                } else {
                    ""
                }
            ),
            color: level_color,
            url: format!("https://dreamhack.io/wargame/challenges/{}", challenge_id),
            timestamp: chrono::Utc::now().to_rfc3339(),
            thumbnail: Image {
                url: solver.profile_image,
            },
        }],
    })
}
