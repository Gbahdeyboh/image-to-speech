const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const { config } = require("dotenv");

config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

async function imageToText() {
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: `
                Return all the text you can see in this image.
                This text will be converted to audio for a visually impaired person to read.
                Ensure you fill in the blanks adequately and format the text in such a way that it makes sense to a visually impaired person.
                Return the text as though the content of the image will be read with added context for the visually impaired individual` },
          {
            type: "image_url",
            image_url:
              "https://image.isu.pub/180305004635-c71c5b26609596ac9c254dffe271dc35/jpg/page_1.jpg",
          },
        ],
      },
    ],
  });
  return response.choices[0].message.content;
}

async function textToSpeech(text){
    const speechFile = path.resolve("./speech.mp3");
    const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: text,
    });
    console.log(speechFile);
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);
}


const main = async () => {
    const generatedText = await imageToText()
    console.log("Generated Text is => ", generatedText);
    await textToSpeech(generatedText);
}

main();


// const firebaseConfig = {
//     apiKey: "AIzaSyD_1-yC7PL9kfhp06iRygTY1VEnfM37Tr0",
//     authDomain: "debo-d791b.firebaseapp.com",
//     databaseURL: "https://debo-d791b.firebaseio.com",
//     projectId: "debo-d791b",
//     storageBucket: "debo-d791b.appspot.com",
//     messagingSenderId: "121504974373",
//     appId: "1:121504974373:web:7fdfe7e4f668009b3c61cc"
// };