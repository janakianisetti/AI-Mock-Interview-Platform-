export function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function canUseSpeech() {
  return Boolean(getSpeechRecognition());
}
