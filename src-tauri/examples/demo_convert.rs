//! Headless adapter for repeatable demo recordings. Uses the application's exact conversion path.
#![allow(unused_attributes)]
#[allow(dead_code)]
#[path = "../src/main.rs"]
mod square;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() != 3 {
        eprintln!("Usage: demo_convert <source-file> <target-extension>");
        std::process::exit(2);
    }
    match square::convert_sync(args[1].clone(), args[2].clone()) {
        Ok(path) => println!("{path}"),
        Err(error) => {
            eprintln!("{error}");
            std::process::exit(1);
        }
    }
}
