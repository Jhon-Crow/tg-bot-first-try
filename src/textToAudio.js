import gTTS from "gtts";

export async function convertTextToAudio(text) {
    return new Promise((resolve, reject) => {
        // Convert text to audio
        const gtts = new gTTS(text, 'ru'); // 'ru' for Russian, change as needed
        const audioFilePath = `./audio/${Date.now()}.ogg`; // Save audio file with a unique name

        gtts.save(audioFilePath, (err) => {
            if (err) {
                console.error(err);
                return reject(err); // Reject the promise on error
            }

            // Resolve the promise with the audio file path
            resolve({ source: audioFilePath });
        });
    });
}