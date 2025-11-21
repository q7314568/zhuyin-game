use std::fs::File;
use std::io::BufReader;
use std::path::{Path, PathBuf};
use std::sync::{mpsc, Mutex};
use std::thread;
use tauri::{Manager, State};

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

#[cfg(target_os = "windows")]
fn generate_audio_file(symbol: &str, path: &Path) -> Result<(), String> {
    // Initialize COM library for the current thread
    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
    }

    let synthesizer = SpeechSynthesizer::new().map_err(|e| e.to_string())?;

    // Set speaking rate to be slower (default is 1.0)
    let options = synthesizer.Options().map_err(|e| e.to_string())?;
    options.SetSpeakingRate(0.5).map_err(|e| e.to_string())?;

    // Create a future for synthesis
    let stream_future = synthesizer
        .SynthesizeTextToStreamAsync(&windows::core::HSTRING::from(symbol))
        .map_err(|e| e.to_string())?;

    // Block until the future completes
    let stream = stream_future.get().map_err(|e| e.to_string())?;

    // Read the stream
    let size = stream.Size().map_err(|e| e.to_string())?;
    let reader = DataReader::CreateDataReader(&stream).map_err(|e| e.to_string())?;
    reader
        .LoadAsync(size as u32)
        .map_err(|e| e.to_string())?
        .get()
        .map_err(|e| e.to_string())?;

    let mut buffer = vec![0u8; size as usize];
    reader.ReadBytes(&mut buffer).map_err(|e| e.to_string())?;

    // Write to file
    std::fs::write(path, buffer).map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg(not(target_os = "windows"))]
fn generate_audio_file(_symbol: &str, _path: &Path) -> Result<(), String> {
    Err("TTS generation is only supported on Windows".to_string())
}

#[tauri::command]
fn play_audio(
    symbol: String,
    state: State<AudioChannel>,
    _app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let tx = state.tx.lock().map_err(|e| e.to_string())?.clone();

    // Spawn a thread to handle audio generation if needed, then send play command
    thread::spawn(move || {
        let index = match get_zhuyin_index(&symbol) {
            Some(i) => i,
            None => {
                eprintln!("Invalid Zhuyin symbol: {}", symbol);
                return;
            }
        };

        // Use padded MP3 filename (e.g., 01.mp3)
        let filename = format!("{:02}.mp3", index);

        // Ensure assets/audio directory exists
        let audio_dir = std::path::Path::new("assets/audio");
        if !audio_dir.exists() {
            let _ = std::fs::create_dir_all(audio_dir);
        }

        let path = audio_dir.join(&filename);

        if !path.exists() {
            eprintln!("Audio file not found: {:?}", path);
            return;
        }

        // Send play command to the actor thread
        if let Err(e) = tx.send(AudioCommand::Play(path)) {
            eprintln!("Failed to send play command: {}", e);
        }
    });

    Ok(())
}

#[tauri::command]
fn stop_audio_backend(state: State<AudioChannel>) -> Result<(), String> {
    let tx = state.tx.lock().map_err(|e| e.to_string())?;
    if let Err(e) = tx.send(AudioCommand::Stop) {
        eprintln!("Failed to send stop command: {}", e);
    }
    Ok(())
}

#[cfg(target_os = "windows")]
fn pre_generate_all_audio() {
    // No-op: we use pre-downloaded MP3 files now
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "windows")]
    pre_generate_all_audio();

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
        .invoke_handler(tauri::generate_handler![
            greet,
            play_audio,
            stop_audio_backend
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
