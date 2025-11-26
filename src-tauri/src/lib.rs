use rodio::Source;
use std::fs::File;
use std::io::BufReader;
use std::path::{Path, PathBuf};
use std::sync::{mpsc, Mutex};
use std::thread;
use tauri::State;

#[cfg(target_os = "windows")]
use windows::{
    Media::SpeechSynthesis::SpeechSynthesizer,
    Storage::Streams::DataReader,
    Win32::System::Com::{CoInitializeEx, COINIT_MULTITHREADED},
};

const ZHUYIN_ORDER: &[&str] = &[
    "ㄅ", "ㄆ", "ㄇ", "ㄈ", "ㄉ", "ㄊ", "ㄋ", "ㄌ", "ㄍ", "ㄎ", "ㄏ", "ㄐ", "ㄑ", "ㄒ", "ㄓ", "ㄔ",
    "ㄕ", "ㄖ", "ㄗ", "ㄘ", "ㄙ", "ㄧ", "ㄨ", "ㄩ", "ㄚ", "ㄛ", "ㄜ", "ㄝ", "ㄞ", "ㄟ", "ㄠ", "ㄡ",
    "ㄢ", "ㄣ", "ㄤ", "ㄥ", "ㄦ",
];

fn get_zhuyin_index(symbol: &str) -> Option<usize> {
    ZHUYIN_ORDER
        .iter()
        .position(|&s| s == symbol)
        .map(|i| i + 1)
}

enum AudioCommand {
    Play(PathBuf),
    Stop,
}

struct AudioChannel {
    tx: Mutex<mpsc::Sender<AudioCommand>>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn play_audio(
    symbol: String,
    state: State<AudioChannel>,
    _app_handle: tauri::AppHandle,
) -> Result<u64, String> {
    let tx = state.tx.lock().map_err(|e| e.to_string())?.clone();

    let index = match get_zhuyin_index(&symbol) {
        Some(i) => i,
        None => return Err(format!("Invalid Zhuyin symbol: {}", symbol)),
    };

    let filename = format!("{:02}.mp3", index);
    let audio_dir = std::path::Path::new("assets/audio");
    let path = audio_dir.join(&filename);

    if !path.exists() {
        return Err(format!("Audio file not found: {:?}", path));
    }

    // Get duration
    let file = File::open(&path).map_err(|e| e.to_string())?;
    let source = rodio::Decoder::new(BufReader::new(file)).map_err(|e| e.to_string())?;

    // Calculate duration in milliseconds
    // total_duration() returns Option<Duration>
    let duration_ms = source
        .total_duration()
        .map(|d| d.as_millis() as u64)
        .unwrap_or(500); // Default to 500ms if unknown

    // Send play command
    if let Err(e) = tx.send(AudioCommand::Play(path)) {
        eprintln!("Failed to send play command: {}", e);
        return Err(e.to_string());
    }

    Ok(duration_ms)
}

#[tauri::command]
fn stop_audio_backend(state: State<AudioChannel>) -> Result<(), String> {
    let tx = state.tx.lock().map_err(|e| e.to_string())?;
    if let Err(e) = tx.send(AudioCommand::Stop) {
        eprintln!("Failed to send stop command: {}", e);
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let (tx, rx) = mpsc::channel();

    // Spawn the Audio Actor thread
    thread::spawn(move || {
        let (_stream, stream_handle) = match rodio::OutputStream::try_default() {
            Ok(s) => s,
            Err(e) => {
                eprintln!("Audio Actor failed to get output stream: {}", e);
                return;
            }
        };

        let mut current_sink: Option<rodio::Sink> = None;

        while let Ok(cmd) = rx.recv() {
            // Stop current sound if any
            if let Some(sink) = current_sink.take() {
                sink.stop();
            }

            match cmd {
                AudioCommand::Play(path) => match rodio::Sink::try_new(&stream_handle) {
                    Ok(sink) => {
                        if let Ok(file) = File::open(&path) {
                            if let Ok(source) = rodio::Decoder::new(BufReader::new(file)) {
                                sink.append(source);
                                current_sink = Some(sink);
                            } else {
                                eprintln!("Failed to decode audio file: {:?}", path);
                            }
                        } else {
                            eprintln!("Failed to open audio file: {:?}", path);
                        }
                    }
                    Err(e) => eprintln!("Failed to create sink: {}", e),
                },
                AudioCommand::Stop => {
                    // Already stopped above
                }
            }
        }
    });

    tauri::Builder::default()
        .manage(AudioChannel { tx: Mutex::new(tx) })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            play_audio,
            stop_audio_backend,
            upload_audio,
            reset_all_audio
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn upload_audio(symbol: String, file_path: String) -> Result<(), String> {
    println!("Upload request: symbol={}, path={}", symbol, file_path);

    if let Ok(cwd) = std::env::current_dir() {
        println!("Current working directory: {:?}", cwd);
    }

    let index = match get_zhuyin_index(&symbol) {
        Some(i) => i,
        None => return Err(format!("Invalid Zhuyin symbol: {}", symbol)),
    };

    let filename = format!("{:02}.mp3", index);
    let audio_dir = std::path::Path::new("assets/audio");
    let originals_dir = std::path::Path::new("assets/audio_originals");

    if !audio_dir.exists() {
        println!("Creating audio dir: {:?}", audio_dir);
        std::fs::create_dir_all(audio_dir).map_err(|e| e.to_string())?;
    }
    if !originals_dir.exists() {
        println!("Creating originals dir: {:?}", originals_dir);
        std::fs::create_dir_all(originals_dir).map_err(|e| e.to_string())?;
    }

    let target_path = audio_dir.join(&filename);
    let original_path = originals_dir.join(&filename);

    println!("Target path: {:?}", target_path);
    println!("Original path: {:?}", original_path);

    // Backup original if not already backed up
    if target_path.exists() && !original_path.exists() {
        println!("Backing up original...");
        std::fs::copy(&target_path, &original_path).map_err(|e| {
            println!("Backup failed: {}", e);
            e.to_string()
        })?;
    }

    // Copy new file
    println!("Copying new file from {} to {:?}", file_path, target_path);
    std::fs::copy(&file_path, &target_path).map_err(|e| {
        println!("Copy failed: {}", e);
        e.to_string()
    })?;

    println!("Upload successful");
    Ok(())
}

#[tauri::command]
fn reset_all_audio() -> Result<(), String> {
    let audio_dir = std::path::Path::new("assets/audio");
    let originals_dir = std::path::Path::new("assets/audio_originals");

    if !originals_dir.exists() {
        return Ok(()); // Nothing to restore
    }

    for entry in std::fs::read_dir(originals_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_file() {
            if let Some(filename) = path.file_name() {
                let target_path = audio_dir.join(filename);
                std::fs::copy(&path, &target_path).map_err(|e| e.to_string())?;
            }
        }
    }

    Ok(())
}
