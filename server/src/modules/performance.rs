use crate::modules::types::ChallengeInfo;
use libm::*;
use std::cmp::max;

pub fn calculate_pp(challenge_info: &ChallengeInfo) -> f64 {
    let base_pp = 10.0 * 1.5 * challenge_info.difficulty as f64;
    let solve_rate = challenge_info.cnt_solvers as f64 / challenge_info.hitcount as f64 * 100.0;
    let pp_multiplier1 = 10.0 / solve_rate;
    let pp_multiplier2 = 2.0 / log10(max(100, 100 + challenge_info.cnt_solvers) as f64);
    let pp_multiplier3 = 3.0 / log10(max(1000, 100 + challenge_info.hitcount) as f64);
    let pp = base_pp * pp_multiplier1 * pp_multiplier2 * pp_multiplier3;
    pp
}
