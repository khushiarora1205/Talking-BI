# voice/tts.py
import io
import tempfile
import os
import subprocess

def synthesise(text: str, voice=None, speed=1.0) -> bytes:
    """
    Use pyttsx3 to synthesise speech, save to a temp WAV file, return bytes.
    Falls back to macOS 'say' command if pyttsx3 fails.
    """
    # --- Try pyttsx3 first ---
    try:
        import pyttsx3
        import wave

        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
            tmp_path = f.name

        engine = pyttsx3.init()
        engine.setProperty('rate', int(180 * speed))   # words per minute
        engine.setProperty('volume', 1.0)

        # Pick a clear voice if available
        voices = engine.getProperty('voices')
        if voices:
            # prefer an English voice
            eng = [v for v in voices if 'english' in v.name.lower() or 'en_' in v.id.lower()]
            engine.setProperty('voice', (eng[0] if eng else voices[0]).id)

        engine.save_to_file(text, tmp_path)
        engine.runAndWait()
        engine.stop()

        with open(tmp_path, 'rb') as f:
            data = f.read()
        os.unlink(tmp_path)

        if len(data) > 44:   # valid WAV has more than just a header
            return data

    except Exception as e:
        print(f"pyttsx3 error: {e}")

    # --- Fallback: macOS 'say' command ---
    try:
        with tempfile.NamedTemporaryFile(suffix='.aiff', delete=False) as f:
            aiff_path = f.name
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
            wav_path = f.name

        subprocess.run(['say', '-o', aiff_path, text], check=True, capture_output=True)
        # Convert aiff → wav using afconvert (built into macOS)
        subprocess.run(['afconvert', '-f', 'WAVE', '-d', 'LEI16', aiff_path, wav_path],
                       check=True, capture_output=True)

        with open(wav_path, 'rb') as f:
            data = f.read()

        os.unlink(aiff_path)
        os.unlink(wav_path)
        return data

    except Exception as e:
        print(f"macOS say fallback error: {e}")
        return b""