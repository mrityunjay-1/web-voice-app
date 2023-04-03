
const speak = ({ text, volume = 1, rate = 1, pitch = 1, lang = 'en' }) => {
    try {

        let utterance = new SpeechSynthesisUtterance();

        utterance.text = text;
        utterance.volume = volume;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.lang = lang;

        speechSynthesis.speak(utterance);

        return utterance;

    } catch (err) {
        console.log("err : ", err);
    }
}

export default speak;