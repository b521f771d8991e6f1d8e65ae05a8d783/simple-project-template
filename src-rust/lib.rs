#![no_std]
#![forbid(unsafe_code)]

#[cfg(not(test))]
use panic_halt as _;

pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
    }
}
