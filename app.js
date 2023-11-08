const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { config } = require('dotenv');
const OpenAI = require('openai');
const cors = require("cors");

config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use('/audio', express.static('audio'));

// Function to save base64 image and return its URL
async function saveBase64Image(base64Image, filename) {
  const buffer = Buffer.from(base64Image, 'base64');
  await fs.promises.writeFile(filename, buffer);
  return filename;
}

// Function to convert image to text
async function imageToText(imageUrl) {
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
              image_url: {
                url: imageUrl
              },
                //"https://image.isu.pub/180305004635-c71c5b26609596ac9c254dffe271dc35/jpg/page_1.jpg",
            },
          ],
        },
    ],
  });
  return response.choices[0].message.content;
}

// Function to convert text to speech
async function textToSpeech(text){
    const audioName = `speech-${Date.now()}.mp3`;
    const speechFile = path.resolve(`./audio/${audioName}`);
    const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: text,
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);
    return audioName;
}

app.use(express.static(path.join(__dirname, '/audio')))

// Endpoint to receive base64 image as FormData and return audio URL
app.post('/upload', async (req, res) => {
    try {
      // Extract base64 image string from FormData
      console.log("req.body => ", req.body);
      const base64Image = req.body.image; // Assuming the form field name is 'image'
      if (!base64Image) {
        return res.status(400).send('No image data provided.');
      }
  
      // Convert image to text
      const text = await imageToText(base64Image);
      console.log("Gotten text is => ", text);
  
      // Convert text to audio
      const audioName = await textToSpeech(text);
      const audioUrl = `${req.protocol}://${req.get('host')}/audio/${audioName}`;
  
      // Send audio URL response
      res.send({ audioUrl });
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while processing the image.');
    }
  });
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });