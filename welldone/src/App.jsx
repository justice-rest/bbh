import React, { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  // Handle WhatsApp chat file upload
  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setFileName(uploadedFile.name);
      setError("");
    }
  };

  // Analyze the WhatsApp chat
  const analyzeChat = async () => {
    if (!file) {
      setError("Please upload a WhatsApp chat export file first!");
      return;
    }

    setAnalyzing(true);
    setError("");
    // Cancel any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
      const text = await readFile(file);
      const analysis = processWhatsAppChat(text);

      if (analysis.error) {
        setError(analysis.error);
        setAnalyzing(false);
        return;
      }

      const prompt = generatePrompt(analysis);
      const roast = await fetchRoastFromGemini(prompt);

      if (roast) {
        setResults({ ...analysis, roast });
      } else {
        setError("Failed to generate roast.");
      }
    } catch (err) {
      setError("An error occurred during analysis. Please try again.");
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper function to read file as text
  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  };

  // Process WhatsApp chat text with full analytics
  const processWhatsAppChat = (chatText) => {
    const lines = chatText.split('\n').filter(line => line.trim() !== '');
    const msgRegex = /\[?(\d+\/\d+\/\d+,?\s\d+:\d+(?::\d+)?(?:\s[AP]M)?)\]?\s-\s([^:]+):\s(.+)/;

    let messages = [];
    let participants = new Set();

    for (const line of lines) {
      const match = line.match(msgRegex);
      if (match) {
        const timestamp = match[1];
        const sender = match[2].trim();
        const content = match[3];

        try {
          const date = new Date(timestamp);
          if (isNaN(date.getTime())) {
            throw new Error("Invalid date");
          }
          participants.add(sender);
          messages.push({ timestamp: date, sender, content });
        } catch (err) {
          console.warn(`Skipping invalid timestamp: ${timestamp}`);
        }
      }
    }

    const participantsList = Array.from(participants);
    if (participantsList.length < 2) {
      return { error: "Could not identify at least two participants in the chat." };
    }

    const userA = participantsList[0];
    const userB = participantsList[1];

    const metrics = calculateMetrics(messages, userA, userB);
    const score = determineScore(metrics);
    const tweetMessage = `This guy has been simping for ${metrics.chatDurationDays} days, please respond.`;

    return {
      participants: participantsList,
      primaryUsers: [userA, userB],
      metrics,
      score,
      tweetMessage,
    };
  };

  // Calculate detailed metrics
  const calculateMetrics = (messages, userA, userB) => {
    const userAMessages = messages.filter(msg => msg.sender === userA);
    const userBMessages = messages.filter(msg => msg.sender === userB);

    const userATextLength = userAMessages.reduce((sum, msg) => sum + msg.content.length, 0);
    const userBTextLength = userBMessages.reduce((sum, msg) => sum + msg.content.length, 0);

    const userAMsgCount = userAMessages.length;
    const userBMsgCount = userBMessages.length;

    const textRatio = userBTextLength ? userATextLength / userBTextLength : userATextLength || 1;

    let userAAvgResponseTime = 0;
    let userBAvgResponseTime = 0;
    let userAIgnoredTime = [];
    let userBIgnoredTime = [];

    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

    for (let i = 1; i < sortedMessages.length; i++) {
      const currentMsg = sortedMessages[i];
      const prevMsg = sortedMessages[i - 1];
      if (currentMsg.sender !== prevMsg.sender) {
        const responseTime = (currentMsg.timestamp - prevMsg.timestamp) / (1000 * 60);
        if (currentMsg.sender === userA) {
          userAAvgResponseTime += responseTime;
          userAIgnoredTime.push(responseTime);
        } else if (currentMsg.sender === userB) {
          userBAvgResponseTime += responseTime;
          userBIgnoredTime.push(responseTime);
        }
      }
    }

    const firstMessageTime = sortedMessages[0]?.timestamp.getTime() || 0;
    const lastMessageTime = sortedMessages[sortedMessages.length - 1]?.timestamp.getTime() || 0;
    const chatDurationDays = Math.ceil((lastMessageTime - firstMessageTime) / (1000 * 60 * 60 * 24)) || 0;

    userAAvgResponseTime = userAIgnoredTime.length ? userAAvgResponseTime / userAIgnoredTime.length : 0;
    userBAvgResponseTime = userBIgnoredTime.length ? userBAvgResponseTime / userBIgnoredTime.length : 0;

    const userAMaxIgnoredTime = userAIgnoredTime.length ? Math.max(...userAIgnoredTime) : 0;
    const userBMaxIgnoredTime = userBIgnoredTime.length ? Math.max(...userBIgnoredTime) : 0;

    return {
      messageCount: { [userA]: userAMsgCount, [userB]: userBMsgCount, total: messages.length },
      textLength: { [userA]: userATextLength, [userB]: userBTextLength },
      textRatio: { [userA]: textRatio, [userB]: userBTextLength ? 1 / textRatio : 0 },
      responseTime: { [userA]: userAAvgResponseTime, [userB]: userBAvgResponseTime },
      chatDurationDays,
      maxIgnoredTime: { [userA]: userAMaxIgnoredTime, [userB]: userBMaxIgnoredTime },
    };
  };

  // Determine score based on metrics
  const determineScore = (metrics) => {
    const users = Object.keys(metrics.messageCount).filter(key => key !== 'total');
    const userA = users[0];
    const userB = users[1];

    let userAScore = 50;
    let userBScore = 50;

    if (metrics.textRatio[userA] > 2.0) {
      userAScore += 15;
      userBScore -= 10;
    } else if (metrics.textRatio[userA] < 0.5) {
      userAScore -= 10;
      userBScore += 15;
    }

    if (metrics.responseTime[userA] > 120) {
      userAScore += 10;
      userBScore -= 10;
    }
    if (metrics.responseTime[userB] > 120) {
      userBScore += 10;
      userAScore -= 10;
    }

    if (metrics.maxIgnoredTime[userA] > 1440) {
      userAScore += 20;
      userBScore -= 15;
    }
    if (metrics.maxIgnoredTime[userB] > 1440) {
      userBScore += 20;
      userAScore -= 15;
    }

    const totalMessages = metrics.messageCount.total;
    const userAMsgPercentage = totalMessages ? metrics.messageCount[userA] / totalMessages : 0;
    if (userAMsgPercentage > 0.65) {
      userAScore += 10;
      userBScore -= 15;
    } else if (userAMsgPercentage < 0.35) {
      userAScore -= 15;
      userBScore += 10;
    }

    userAScore = Math.max(0, Math.min(100, userAScore));
    userBScore = Math.max(0, Math.min(100, userBScore));

    return { [userA]: userAScore, [userB]: userBScore };
  };

  // Generate prompt for Gemini API
  const generatePrompt = (analysis) => {
    const { primaryUsers, metrics, score } = analysis;
    const [userA, userB] = primaryUsers;

    return `
      Generate a humorous roast based on the following WhatsApp chat metrics between ${userA}(the guy) and ${userB}(the girl).
      Metrics(use normal english words and keep it to 4 sentences max, roast in a borderline insulting manner):
      - ${userA} sent ${metrics.messageCount[userA]} messages, ${userB} sent ${metrics.messageCount[userB]} messages.
      - ${userA}'s total text length: ${metrics.textLength[userA]} characters, ${userB}'s: ${metrics.textLength[userB]} characters.
      - Text ratio: ${metrics.textRatio[userA].toFixed(2)} (A:B).
      - Average response time: ${userA}: ${metrics.responseTime[userA].toFixed(2)} min, ${userB}: ${metrics.responseTime[userB].toFixed(2)} min.
      - Max ignored time: ${userA}: ${metrics.maxIgnoredTime[userA].toFixed(2)} min, ${userB}: ${metrics.maxIgnoredTime[userB].toFixed(2)} min.
      - Chat duration: ${metrics.chatDurationDays} days.
      - Scores: ${userA}: ${score[userA]}, ${userB}: ${score[userB]}.
      Roast in a roasty manner, roast like trevor wallace while also focusing on the chat dynamics.
    `;
  };

  // Fetch roast from Gemini API
  const fetchRoastFromGemini = async (prompt) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      const data = await response.json();
      if (
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0]
      ) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Invalid response from Gemini API");
      }
    } catch (err) {
      console.error("Error fetching roast from Gemini API:", err);
      return null;
    }
  };

  // Handle image selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setError('');
    } else {
      setError('Please select a valid image file.');
    }
  };

  // Upload image to ImgBB and open Twitter Intent
  const handlePostToTwitter = async () => {
    if (!selectedImage || !results?.tweetMessage) {
      setError('Please select an image and complete the analysis first.');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await fetch('https://api.imgbb.com/1/upload?key=4505a7f499f69e586b8848f08726157d', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        const imageUrl = data.data.url;
        const tweetText = encodeURIComponent(results.tweetMessage + ' ');
        const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(imageUrl)}`;
        window.open(twitterUrl, '_blank');
      } else {
        setError('Failed to upload image to ImgBB.');
      }
    } catch (err) {
      setError('An error occurred while uploading the image.');
    }
  };

  // Text-to-speech effect
  useEffect(() => {
    if (results && results.roast && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(results.roast);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }, [results]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 shadow-md">
        <h1 className="text-2xl font-bold text-center text-green-500">Anti Motivator</h1>
        <p className="text-center text-gray-400 mt-1">Let's see how downbad you are</p>
      </header>

      <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload WhatsApp Chat</h2>

          <div className="mb-6">
            <p className="text-gray-400 mb-3 text-sm">
              Export your WhatsApp chat without media and upload the .txt file here
            </p>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <label className="flex-grow w-full">
                <div className="bg-gray-700 border border-gray-600 rounded-md px-4 py-3 cursor-pointer hover:bg-gray-600 transition duration-200 text-center">
                  {fileName || "Choose WhatsApp chat export (.txt)"}
                </div>
                <input
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              <button
                onClick={analyzeChat}
                disabled={analyzing || !file}
                className={`px-6 py-3 rounded-full font-medium ${
                  analyzing || !file
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-black'
                } transition duration-200`}
              >
                {analyzing ? "Analyzing..." : "Analyze Chat"}
              </button>
            </div>

            {error && (
              <div className="mt-3 text-red-400">
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>

        {results && !results.error && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Chat Analysis Results</h2>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Participants</h3>
              <ul className="list-disc list-inside text-gray-400">
                {results.participants.map((participant, index) => (
                  <li key={index}>{participant}</li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Metrics for {results.primaryUsers[0]} and {results.primaryUsers[1]}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">{results.primaryUsers[0]}</h4>
                  <p>Messages: {results.metrics.messageCount[results.primaryUsers[0]]}</p>
                  <p>Text Length: {results.metrics.textLength[results.primaryUsers[0]]}</p>
                  <p>Avg Response Time: {results.metrics.responseTime[results.primaryUsers[0]].toFixed(2)} min</p>
                  <p>Max Ignored Time: {results.metrics.maxIgnoredTime[results.primaryUsers[0]].toFixed(2)} min</p>
                </div>
                <div>
                  <h4 className="font-semibold">{results.primaryUsers[1]}</h4>
                  <p>Messages: {results.metrics.messageCount[results.primaryUsers[1]]}</p>
                  <p>Text Length: {results.metrics.textLength[results.primaryUsers[1]]}</p>
                  <p>Avg Response Time: {results.metrics.responseTime[results.primaryUsers[1]].toFixed(2)} min</p>
                  <p>Max Ignored Time: {results.metrics.maxIgnoredTime[results.primaryUsers[1]].toFixed(2)} min</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Scores</h3>
              <p>{results.primaryUsers[0]}: {results.score[results.primaryUsers[0]]}</p>
              <p>{results.primaryUsers[1]}: {results.score[results.primaryUsers[1]]}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Roast</h3>
              <blockquote className="border-l-4 border-green-500 pl-4 italic text-gray-400">
                {results.roast || "Generating roast..."}
              </blockquote>
              <button
                onClick={() => {
                  if (window.speechSynthesis && results.roast) {
                    const utterance = new SpeechSynthesisUtterance(results.roast);
                    utterance.lang = 'en-US';
                    window.speechSynthesis.speak(utterance);
                  }
                }}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Listen Again
              </button>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Share your shame</h3>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="mb-2"
              />
              {selectedImage && (
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Preview"
                  style={{ maxWidth: '300px', marginTop: '10px', marginBottom: '10px' }}
                />
              )}
              <button
                onClick={handlePostToTwitter}
                disabled={!selectedImage}
                className={`px-4 py-2 rounded ${
                  selectedImage ? 'bg-blue-500 text-white' : 'bg-gray-500 cursor-not-allowed'
                }`}
              >
                Post to Twitter
              </button>
            </div>
          </div>
        )}

        {results && results.error && (
          <div className="bg-red-900 p-4 rounded-lg">
            <p className="text-red-200">{results.error}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;